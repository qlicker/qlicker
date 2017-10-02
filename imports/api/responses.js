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

import { ROLES, QUESTION_TYPE } from '../configs'

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
    check(questionId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const question = Questions.findOne({ _id: questionId })
      const session = Sessions.findOne({ _id: question.sessionId })
      if (!question.sessionId) return this.ready()
      const course = Courses.findOne({ _id: session.courseId })

      if (user.isInstructor(course._id)) {
        return Responses.find({ questionId: questionId })
      } else if (user.hasRole(ROLES.student)) {
        const findCriteria = { questionId: questionId }
        return Responses.find(findCriteria)
      }
    } else this.ready()
  })

  Meteor.publish('responses.forSession', function (sessionId) {
    check(sessionId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const session = Sessions.findOne({ _id: sessionId })
      const course = Courses.findOne({ _id: session.courseId })

      if (user.isInstructor(course._id)) {
        return Responses.find({ questionId: { $in: session.questions } })
      } else if (user.hasRole(ROLES.student)) {
        return Responses.find({ questionId: { $in: session.questions }, studentUserId: this.userId })
      }
    } else this.ready()
  })

  Meteor.publish('responses.forCourse', function (courseId) {
    check(courseId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })

      const sessions = Sessions.find({ courseId: courseId }).fetch()
      const questionIds = _.flatten(_(sessions).pluck('questions'))

      if (user.isInstructor(courseId)) {
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
    const correct = _.map(_.filter(q.options, {correct: true}), (op) => op.answer) // correct responses
    let resp = responseObject.answer

    let mark = 0
    switch (q.type) {
      case QUESTION_TYPE.MC:
        mark = correct[0] === resp ? 1 : 0
        break
      case QUESTION_TYPE.TF:
        mark = correct[0] === resp ? 1 : 0
        break
      case QUESTION_TYPE.SA:
        mark = resp ? 1 : 0
        break
      case QUESTION_TYPE.MS: // (correct responses-incorrect responses)/(correct answers)
        const intersection = _.intersection(correct, resp)
        const percentage = (2 * intersection.length - resp.length) / correct.length
        mark = percentage > 0 ? percentage : 0
        break
    }

    responseObject.mark = mark
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
