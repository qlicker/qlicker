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
  TAs: Match.Maybe([Helpers.MongoID]),
  sessions: Match.Maybe([Helpers.MongoID]),
  createdAt: Date
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
      if (user.hasGreaterRole(ROLES.prof)) {
        return Courses.find({ owner: this.userId })
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
            const updatedCoursesArray = fields.profile.courses
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
  let courseOwner = Courses.findOne({ _id: courseId }).owner

  if (Meteor.user().hasRole(ROLES.admin) ||
      (Meteor.user().hasRole(ROLES.prof) && Meteor.userId() === courseOwner)) {
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

    course.deptCode = course.deptCode.toLowerCase()
    course.courseNumber = course.courseNumber.toLowerCase()
    course.semester = course.semester.toLowerCase()

    return Courses.insert(course)
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
   * adds a TA to a course
   * @param {String} enrollmentCode
   */
  'courses.addTA' (courseId, userId) {
    check(userId, Helpers.NEString)
    const c = Courses.findOne({
      _id: courseId
    })
    console.log(courseId)
    Courses.update({ _id: c._id }, {
      $addToSet: { TAs: Meteor.userId() }
    })
    return c
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

  // course<=>session methods

  /**
   * inserts a session into the Session collection and adds it to the course
   * @param {MongoID} courseId
   * @param {Session} session
   * @returns {MongoId} id new session
   */
  'courses.createSession' (courseId, session) {
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
    const c = Courses.findOne(courseId).courseCode().toUpperCase()
    return { value: c, label: c }
  },

  /**
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
  }

}) // end Meteor.methods

