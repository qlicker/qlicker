// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// grades.js: JS related to grade collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import Helpers from './helpers.js'
import { Sessions } from './sessions.js'
import { Courses } from './courses.js'
import { Questions } from './questions.js'
import { ROLES } from '../configs'

// expected collection pattern
const gradePattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  userId: Helpers.NEString, // Id of user whose grade this is
  courseId: Match.Maybe(Helpers.NEString), // course Id of the grade
  sessionId: Match.Maybe(Helpers.NEString), // session Id of the grade
  marks: Match.Maybe([ { // a set of marks that result in the grade
    questionId: Match.Maybe(Helpers.NEString), //Id of question
    value: Match.Maybe(Number), // value of the mark for that question
    calculated: Match.Maybe(Boolean), //whehter the value was automatically calculated (and should be automatically updated)
  } ])
  grade: Match.Maybe(Number), // value of the grade
  outOf: Match.Maybe(Number)// values used to scale the grade
  visibleToStudents: Match.Maybe(Boolean)// whether grade is visible to students (non-instructors)
}

// Create grade class
export const Grade = function (doc) { _.extend(this, doc) }

// Create grade collection
export const Grades = new Mongo.Collection('grades',
  { transform: (doc) => { return new Grade(doc) } })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('grades', function () {
    if (this.userId) {
      let user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin)) {
        return Grades.find()
      } else if (user.isInstructorAnyCourse()) {
        const courses = user.coursesInstructed()
        return Grades.find({ courseId: { $in: courses || [] } }) // finds all the course owned
      } else {
        return Grades.find({ userId: this.userId, visibleToStudents: true } )
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
 * Meteor methods for grades object
 * @module grades
 */
Meteor.methods({

  /**
   * insert new course object into Courses mongodb Collection
   * @param {Course} course - course object without id
   * @returns {MongoId} id of new course
   */
  'grades.insert' (grade) {
    check(grade, gradePattern)
    const user = Meteor.user()

    if ( !user.hasRole(ROLES.admin) &&
         !user.isInstructorAnyCourse() ) {
      throw new Meteor.Error('not-authorized')
    }

    const g = Grades.insert(grade, (e, id) => {
      if (e) alertify.error('Error inserting grade')
    })
    return c
  },


}) // end Meteor.methods
