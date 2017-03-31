/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// responses.js: JS related to question responses

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { Courses } from './courses'
import { Sessions } from './sessions'
import { Questions } from './questions'

import { _ } from 'underscore'

import Helpers from './helpers.js'

import { ROLES } from '../configs'

// expected collection pattern
const responsePattern = {
  _id: Match.Maybe(Helpers.MongoID),
  attempt: Number,
  questionId: Helpers.MongoID,
  studentUserId: Helpers.MongoID,
  answer: Helpers.AnswerItem,
  createdAt: Date
}

// Create Response class
const Response = function (doc) { _.extend(this, doc) }
_.extend(Response.prototype, {})

// Create Responses collection
export const Responses = new Mongo.Collection('responses',
  { transform: (doc) => { return new Response(doc) } })

// data publishing
if (Meteor.isServer) {
  // questions in a specific question
  Meteor.publish('responses.forQuestion', function (questionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const question = Questions.findOne({ _id: questionId })
      const session = Sessions.findOne({ _id: question.sessionId })
      if (!question.sessionId) return this.ready()
      const course = Courses.findOne({ _id: session.courseId })

      if (user.hasRole(ROLES.prof) && course.owner === this.userId) {
        return Responses.find({ questionId: questionId })
      } else if (user.hasRole(ROLES.student)) {
        const findCriteria = { questionId: questionId }
        return Responses.find(findCriteria)
      }
    } else this.ready()
  })

  Meteor.publish('responses.forSession', function (sessionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const session = Sessions.findOne({ _id: sessionId })
      const course = Courses.findOne({ _id: session.courseId })

      if (user.hasRole(ROLES.prof) && course.owner === this.userId) {
        return Responses.find({ questionId: { $in: session.questions } })
      } else if (user.hasRole(ROLES.student)) {
        return Responses.find({ questionId: { $in: session.questions }, studentUserId: this.userId })
      }
    } else this.ready()
  })

  Meteor.publish('responses.forCourse', function (courseId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const course = Courses.findOne({ _id: courseId })

      const sessions = Sessions.find({ courseId: courseId }).fetch()
      const questionIds = _.flatten(_(sessions).pluck('questions'))

      if (user.hasRole(ROLES.prof) && course.owner === this.userId) {
        return Responses.find({ questionId: { $in: questionIds } })
      } else if (user.hasRole(ROLES.student)) {
        return Responses.find({ questionId: { $in: questionIds }, studentUserId: this.userId })
      }
    } else this.ready()
  })
}

/**
 * Meteor methods for responses object
 * @module responses
 */
Meteor.methods({

  /**
   * add a student result to question (that is attached to session)
   * @param {Response} responseObject
   */
  'responses.add' (responseObject) {
    responseObject.createdAt = new Date()
    check(responseObject, responsePattern)

    const q = Questions.findOne({ _id: responseObject.questionId })
    if (!q.sessionId) throw Error('Question not attached to session')
    if (Meteor.userId() !== responseObject.studentUserId) throw Error('Cannot submit answer')

    // TODO check if attempt number is current in question

    const c = Responses.find({
      attempt: responseObject.attempt,
      questionId: responseObject.questionId,
      studentUserId: responseObject.studentUserId
    }).count()
    if (c > 0) return Meteor.call('responses.update', responseObject)

    return Responses.insert(responseObject)
  },


  /**
   * add a student result to question (that is attached to session)
   * @param {Response} responseObject
   */
  'responses.update' (responseObject) {
    check(responseObject, responsePattern)

    return Responses.update({
      attempt: responseObject.attempt,
      questionId: responseObject.questionId,
      studentUserId: responseObject.studentUserId
    }, { $set: { answer: responseObject.answer } })
  }

}) // end Meteor.methods
