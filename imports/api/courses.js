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
      const user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.prof)) {
        return Courses.find({ owner: this.userId })
      } else {
        // const coursesArray = user.profile.courses || [] // TODO fix enrollment bug
        return Courses.find({ }, { fields: { students: false } })
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
   * courses.checkAndEnroll(String: deptCode, String: courseNumber, String: enrollmentCode)
   * verifies validity of code and enrolls student
   */
  'courses.checkAndEnroll' (deptCode, courseNumber, enrollmentCode) {
    check(deptCode, Helpers.NEString)
    check(courseNumber, Helpers.NEString)
    check(enrollmentCode, Helpers.NEString)
    const c = Courses.findOne({
      deptCode: deptCode.toLowerCase(),
      courseNumber: courseNumber.toLowerCase(),
      enrollmentCode: enrollmentCode.toLowerCase()
    })

    if (c) {
      Meteor.users.update({ _id: Meteor.userId() }, { // TODO check status before returning
        $addToSet: { 'profile.courses': c._id }
      })
      Courses.update({ _id: c._id }, {
        $addToSet: { students: Meteor.userId() }
      })
      return c
    }
    throw Error('Couldn\'t enroll in course')
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

