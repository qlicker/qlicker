// QLICKER
// Author: Enoch T <me@enocht.am>
//
// courses.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import Helpers from './helpers.js'
// import { Sessions } from './sessions.js'
import { ROLES } from '../configs'

// expected collection pattern
const coursePattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  name: Helpers.NEString, // Information Technology Project (2016-17)
  deptCode: Helpers.NEString, // CISC
  courseNumber: Helpers.NEString, // 498
  section: Helpers.NEString, // 001
  owner: Helpers.MongoID, // mongo db id reference
  enrollmentCode: Helpers.NEString,
  semester: Helpers.NEString, // F17, W16, S15, FW16 etc.
  inactive: Match.Maybe(Boolean),
  students: Match.Maybe([Helpers.MongoID]),
  instructors: Match.Maybe([Helpers.MongoID]),
  sessions: Match.Maybe([Helpers.MongoID]),
  createdAt: Date,
  requireVerified: Match.Maybe(Boolean),
  allowStudentQuestions: Match.Maybe(Boolean)
}

// Create course class
export const Course = function (doc) { _.extend(this, doc) }
_.extend(Course.prototype, {
  courseCode: function () {
    return this.deptCode.toLowerCase() + this.courseNumber.toLowerCase()
  },
  fullCourseCode: function () {
    return this.deptCode + ' ' + this.courseNumber + ' - ' + this.section
  }
})

// Create course collection
export const Courses = new Mongo.Collection('courses',
  { transform: (doc) => { return new Course(doc) } })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('courses', function () {
    if (this.userId) {
      let user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin)){
        return Courses.find()
      }else if (user.hasGreaterRole(ROLES.prof) || Courses.findOne({ instructors: user._id })) {
        return Courses.find({ _id: { $in: user.profile.courses || [] } }) // finds all the course owned
      } else {
        let coursesArray = user.profile.courses || []
        return Courses.find({ _id: { $in: coursesArray } }, { fields: { students: false } })
      }
    } else this.ready()
  })

  Meteor.publish('courses.userObserveChanges', function () {
    if (this.userId) {
      let user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.student)) {
        // manually add courses to array
        // When student is enrolling in a course,
        //  regular cursor find depends on user object which doesn't always trigger an update
        let coursesArray = user.profile.courses || []
        const courses = Courses.find({ _id: { $in: coursesArray } }, { fields: { students: false } }).fetch()
        courses.forEach((c) => {
          this.added('courses', c._id, c)
        })
        this.ready()

        // manually observe changes on the student user object
        const userCursor = Meteor.users.find({ _id: this.userId })
        const handle = userCursor.observeChanges({
          changed: (id, fields) => {
            const updatedCoursesArray = fields.profile && fields.profile.courses? fields.profile.courses: []
            const newCourseIds = _.difference(updatedCoursesArray, coursesArray)

            newCourseIds.forEach((cId) => {
              const newCourse = Courses.findOne({ _id: cId }, { fields: { students: false } })
              this.added('courses', cId, newCourse) // add newly enrolled course to subscription
            })
            this.ready()
          }
        })

        this.onStop(function () {
          handle.stop()
        })
        // TODO implement this to improve perf http://stackoverflow.com/a/21148698
      }
    } else this.ready()
  })
}

// course permissions helper
export const profHasCoursePermission = (courseId) => {
  check(courseId, Helpers.MongoID)
  let course = Courses.findOne({ _id: courseId }) || []
  if (Meteor.user().hasRole(ROLES.admin) ||
    _.indexOf(course.instructors, Meteor.userId()) !== -1 ||
    Meteor.user().isInstructor(courseId)) {
    return
  } else {
    throw new Meteor.Error('not-authorized')
  }
}

/**
 * Meteor methods for courses object
 * @module courses
 */
Meteor.methods({

  /**
   * insert new course object into Courses mongodb Collection
   * @param {Course} course - course object without id
   * @returns {MongoId} id of new course
   */
  'courses.insert' (course) {
    course.enrollmentCode = Helpers.RandomEnrollmentCode()

    check(course, coursePattern)
    if (!Meteor.user().hasRole(ROLES.admin) &&
      !Meteor.user().hasRole(ROLES.prof)) {
      throw new Meteor.Error('not-authorized')
    }

    const admins = _.pluck(Meteor.users.find({'profile.roles': 'admin'}).fetch(), '_id')
    course.deptCode = course.deptCode.toLowerCase()
    course.courseNumber = course.courseNumber.toLowerCase()
    course.semester = course.semester.toLowerCase()
    course.instructors = [Meteor.userId()].concat(admins)

    const c = Courses.insert(course, (e, id) => {
      if (e) alertify.error('Error creating course')
      else {
        Meteor.users.update({'profile.roles': 'admin'}, {$addToSet: { 'profile.courses': id }}, {multi: true})
        Meteor.users.update({ _id: Meteor.userId() }, { // TODO check status before returning
          $addToSet: { 'profile.courses': id }
        })
      }
    })
    return c
  },

  /**
   * deletes course object Courses mongodb Collection
   * @param {MongoID} courseId
   */
  'courses.delete' (courseId) {
    profHasCoursePermission(courseId)

    const course = Courses.find({ _id: courseId }).fetch()[0]
    if (course.students) {
      course.students.forEach((sId) => {
        Meteor.call('courses.removeStudent', courseId, sId)
      })
    }
    course.instructors.forEach((uId) => {
      if (uId !== Meteor.userId()) Meteor.call('courses.removeTA', courseId, uId)
    })

    return Courses.remove({ _id: courseId })
  },

  /**
   * generates and sets a new enrollment code for the course
   * @param {MongoID} courseId
   * @returns {Course} the course in question
   */
  'courses.regenerateCode' (courseId) {
    profHasCoursePermission(courseId)

    const enrollmentCode = Helpers.RandomEnrollmentCode()
    Courses.update({ _id: courseId }, {
      $set: {
        enrollmentCode: enrollmentCode
      }
    })

    return Courses.find({ _id: courseId }).fetch()
  },

  /**
   * verifies validity of code and enrolls student
   * @param {String} enrollmentCode
   */
  'courses.checkAndEnroll' (enrollmentCode) {
    check(enrollmentCode, Helpers.NEString)
    const c = Courses.findOne({
      enrollmentCode: enrollmentCode.toLowerCase()
    })

    if (!c) throw new Meteor.Error('code-not-found', 'Couldn\'t enroll in course')

    if (!c.inactive) {
      const hasVerified = _.some(Meteor.user().emails, (email) => email.verified)
      if (c.requireVerified && !hasVerified) {
        throw new Meteor.Error('could-not-enroll', 'Verified email required')
      }
      Meteor.users.update({ _id: Meteor.userId() }, { // TODO check status before returning
        $addToSet: { 'profile.courses': c._id }
      })
      Courses.update({ _id: c._id }, {
        $addToSet: { students: Meteor.userId() }
      })
      return c
    }
    throw new Meteor.Error('could-not-enroll', 'Couldn\'t enroll in course')
  },

  /**
   * edits and updates all valid attributes of the course
   * @param {Course} course
   */
  'courses.edit' (course) {
    check(course._id, Helpers.MongoID)
    check(course, coursePattern)
    let courseId = course._id

    profHasCoursePermission(courseId)

    return Courses.update({ _id: courseId }, {
      $set: {
        name: course.name,
        deptCode: course.deptCode.toLowerCase(),
        courseNumber: course.courseNumber.toLowerCase(),
        section: course.section,
        semester: course.semester.toLowerCase(),
        owner: course.owner // this method used to change course owner
      }
    })
  },

  // course<=>user methods

  /**
   * adds a student to course
   * @param {MongoID} courseId
   * @param {MongoId} studentUserId
   */
  'courses.addStudent' (courseId, studentUserId) { // TODO enforce permission
    check(courseId, Helpers.MongoID)
    check(studentUserId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    Meteor.users.update({ _id: studentUserId }, {
      $addToSet: { 'profile.courses': courseId }
    })

    return Courses.update({ _id: courseId }, {
      $addToSet: { students: studentUserId }
    })
  },

  /**
   * adds a TA to a course
   * @param {String} email
   * @param {String} courseId
   */
  'courses.addTA' (email, courseId) {
    check(email, Helpers.Email)
    check(courseId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    const user = Meteor.users.findOne({ 'emails.0.address': email })
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')

    Meteor.users.update({ _id: user._id }, {
      $addToSet: { 'profile.courses': courseId }
    })
    Courses.update({ _id: courseId }, {
      $pull: { students: user._id }
    })
    return Courses.update({ _id: courseId }, {
      '$addToSet': { instructors: user._id }
    })
  },

  /**
   * removes a student to course
   * @param {MongoID} courseId
   * @param {MongoId} studentUserId
   */
  'courses.removeStudent' (courseId, studentUserId) {
    check(courseId, Helpers.MongoID)
    check(studentUserId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    Meteor.users.update({ _id: studentUserId }, {
      $pull: { 'profile.courses': courseId }
    })
    return Courses.update({ _id: courseId }, {
      $pull: { students: studentUserId }
    })
  },

  /**
   * removes a TA from a course
   * @param {MongoID} courseId
   * @param {MongoId} TAUserId
   */
  'courses.removeTA' (courseId, TAUserId) {
    check(courseId, Helpers.MongoID)
    check(TAUserId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    Meteor.users.update({ _id: TAUserId }, {
      $pull: { 'profile.courses': courseId }
    })
    return Courses.update({ _id: courseId }, {
      $pull: { instructors: TAUserId }
    })
  },

  // course<=>session methods

  /**
   * inserts a session into the Session collection and adds it to the course
   * @param {MongoID} courseId
   * @param {Session} session
   * @returns {MongoId} id new session
   */
  'courses.createSession' (courseId, session) {
    profHasCoursePermission(courseId)
    session.courseId = courseId
    const sessionId = Meteor.call('sessions.insert', session)
    Courses.update({ _id: courseId }, {
      $addToSet: { sessions: sessionId }
    })
    return sessionId
  },

  /**
   * deletes the session from collection and removes link from course
   * @param {MongoID} courseId
   * @param {Session} session
   */
  'courses.deleteSession' (courseId, sessionId) {
    check(sessionId, Helpers.MongoID)
    profHasCoursePermission(courseId)
    Courses.update({ _id: courseId }, {
      $pull: { sessions: sessionId }
    })
    return Meteor.call('sessions.delete', courseId, sessionId)
  },

  /**
   * get tag object for a specific courseid for react multi select component
   * @param {MongoID} courseId
   * @returns {String} tag.value
   * @returns {String} tag.label
   */
  'courses.getCourseCodeTag' (courseId) {
    check(courseId, Helpers.MongoID)
    const course = Courses.findOne(courseId)

    const c = course ? course.courseCode().toUpperCase() : null
    const tag = c ? { value: c, label: c } : null
    return tag
  },
  /**
   * get course code for a specific courseid for react multi select component
   * @param {MongoID} courseId
   * @returns {String} courseCode
   */
  'courses.getCourseCode' (courseId) {
    check(courseId, Helpers.MongoID)
    const course = Courses.findOne(courseId)
    const c = course ? course.courseCode().toUpperCase() : null
    return c
  },
  /**
   * get course tags for which user is an instructor and _ids for use in course select componenet
   * @returns {MongoID} obj._id
   * @returns {String} obj.code
   */
  'courses.getCourseTags' () {
    const courses = Courses.find({ instructors: Meteor.userId()}).fetch()
    return _.map(courses, (course) => { return {_id: course._id, code: course.courseCode().toUpperCase()} })
  },
  /**
   * get course tags for profile.courses
   * @returns {MongoID} obj._id
   * @returns {String} obj.code
   */
  'courses.getCourseTagsProfile' () {
    const courses = Meteor.user()? Courses.find({_id: {$in:Meteor.user().profile.courses} }).fetch():[]
    return _.map(courses, (course) => { return {_id: course._id, code: course.courseCode().toUpperCase()} })
  },  /**
   * set inactive attribute based on bool
   * @param {MongoID} courseId
   * @param {Boolean} active
   */
  'courses.setActive' (courseId, active) {
    check(courseId, Helpers.MongoID)
    check(active, Boolean)

    profHasCoursePermission(courseId)

    return Courses.update({ _id: courseId }, {
      $set: {
        inactive: !active
      }
    })
  },

  /**
   * set requireVerified attribute based on bool
   * @param {MongoID} courseId
   * @param {Boolean} active
   */
  'courses.setVerification' (courseId, isRequired) {
    check(courseId, Helpers.MongoID)
    check(isRequired, Boolean)

    profHasCoursePermission(courseId)

    return Courses.update({ _id: courseId }, {
      $set: {
        requireVerified: isRequired
      }
    })
  },
  /**
   * generates and sets a new enrollment code for the course
   * @param {MongoID} courseId
   * @returns {Boolean}
   */
  'courses.toggleAllowStudentQuestions' (courseId) {
    profHasCoursePermission(courseId)
    course = Courses.findOne(courseId)
    const previous = course.allowStudentQuestions
    Courses.update({ _id: courseId }, {
      $set: {
        allowStudentQuestions: !previous
      }
    })
  },
}) // end Meteor.methods
