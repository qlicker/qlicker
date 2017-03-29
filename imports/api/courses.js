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

// data methods
Meteor.methods({

  /**
   * courses.insert(Course: course)
   * insert new course object into Courses mongodb Collection
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
   * courses.delete(String (mongoid): courseId)
   * deletes course object Courses mongodb Collection
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
   * courses.regenerateCode(String (mongoid): courseId)
   * generates and sets a new enrollment code for the course
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
   * courses.checkAndEnroll(String: enrollmentCode)
   * verifies validity of code and enrolls student
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
   * courses.edit(Course: course)
   * edits and updates all valid attributes of the course
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
   * courses.addStudent(String (mongoid): courseId, String (mongoid): studentUserId)
   * adds a student to course
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
   * courses.removeStudent(String (mongoid): courseId, String (mongoid): studentUserId)
   * removes a student to course
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
   * courses.createSession(String (mongoid): courseId, Session session)
   * inserts a session into the Session collection and adds it to the course
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
   * courses.deleteSession(String (mongoid): courseId, Session session)
   * deletes the session from collection and removes link from course
   */
  'courses.deleteSession' (courseId, sessionId) {
    Courses.update({ _id: courseId }, {
      $pull: { sessions: sessionId }
    })
    return Meteor.call('sessions.delete', courseId, sessionId)
  },

  /**
   * courses.getCourseCodeTag(String (mongoid): courseId)
   * get tag object for a specific courseid for react multi select component
   */
  'courses.getCourseCodeTag' (courseId) {
    const c = Courses.findOne(courseId).courseCode().toUpperCase()
    return { value: c, label: c }
  },

  /**
   * courses.setActive(String (mongoid): courseId, Boolean active)
   * set inactive attribute based on bool
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

