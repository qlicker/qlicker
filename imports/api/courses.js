// QLICKER
// Author: Enoch T <me@enocht.am>
//
// course.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import Helpers from './helpers.js'

export const Courses = new Mongo.Collection('courses')

// object pattern
const coursePattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  name: Helpers.NEString, // Information Technology Project (2016-17)
  deptCode: Helpers.NEString, // CISC
  courseNumber: Helpers.NEString, // 498
  section: Helpers.NEString, // 001
  owner: Helpers.NEString, // mongo db id reference
  enrollmentCode: Helpers.NEString,
  createdAt: Date
}

// data publishing
if (Meteor.isServer) {
  Meteor.publish('courses', function () {
    if (this.userId) {
      return Courses.find({ owner: this.userId })
    } else {
      this.ready()
    }
  })
}

// course permissions helper
const verfiyCourseHasPermissions = (courseId) => {
  if (!Meteor.isTest) {
    let courseOwner = Courses.findOne({ _id: courseId }).owner

    if (Meteor.userHasRole(Meteor.user(), 'admin') ||
        (Meteor.userHasRole(Meteor.user(), 'professor') && Meteor.userId() === courseOwner)) {
      return
    } else {
      throw new Meteor.Error('not-authorized')
    }
  }
}

// data methods
Meteor.methods({

  'courses.insert' (course) {
    course.enrollmentCode = Helpers.RandomEnrollmentCode()

    check(course, coursePattern) // TODO change to check pattern

    if (!Meteor.isTest) {
      if (!Meteor.userHasRole(Meteor.user(), 'admin') &&
        !Meteor.userHasRole(Meteor.user(), 'professor')) {
        throw new Meteor.Error('not-authorized')
      }
    }

    return Courses.insert(course)
  },

  'courses.delete' (courseId) {
    verfiyCourseHasPermissions(courseId)
    return Courses.remove({ _id: courseId })
  },

  'courses.edit' (course) {
    check(course._id, Helpers.NEString)
    check(course, coursePattern)
    let courseId = course._id

    verfiyCourseHasPermissions(courseId)

    return Courses.update({ _id: courseId }, {
      $set: {
        name: course.name,
        deptCode: course.deptCode,
        courseNumber: course.courseNumber,
        section: course.section,
        owner: course.owner // this method used to change course owner
      }
    })
  }

})
