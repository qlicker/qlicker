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
        return Responses.find({ questionId: questionId }) // TODO
      }
    } else this.ready()
  })

  Meteor.publish('responses.forSession', function (sessionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const session = Sessions.findOne({ _id: sessionId })
      const course = Courses.findOne({ _id: session.courseId })

      if (user.hasRole('professor') && course.owner === this.userId) {
        return Responses.find({ questionId: { $in: session.questions } })
      } else if (user.hasRole('student')) {
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

      if (user.hasRole('professor') && course.owner === this.userId) {
        return Responses.find({ questionId: { $in: questionIds } })
      } else if (user.hasRole('student')) {
        return Responses.find({ questionId: { $in: questionIds }, studentUserId: this.userId })
      }
    } else this.ready()
  })
}

// data methods
Meteor.methods({

  /**
   * responses.add(Reponse responseObject)
   * add a student result to question (that is attached to session)
   */
  'responses.add' (answerObject) {
    answerObject.createdAt = new Date()
    check(answerObject, responsePattern)

    const q = Questions.findOne({ _id: answerObject.questionId })
    if (!q.sessionId) throw Error('Question not attached to session')
    if (Meteor.userId() !== answerObject.studentUserId) throw Error('Cannot submit answer')

    // TODO check if attempt number is current in question

    const c = Responses.find({
      attempt: answerObject.attempt,
      questionId: answerObject.questionId,
      studentUserId: answerObject.studentUserId
    }).count()
    if (c > 0) return Meteor.call('responses.update', answerObject)

    return Responses.insert(answerObject)
  },

  'responses.update' (answerObject) {
    check(answerObject, responsePattern)

    return Responses.update({
      attempt: answerObject.attempt,
      questionId: answerObject.questionId,
      studentUserId: answerObject.studentUserId
    }, { $set: { answer: answerObject.answer } })
  }

}) // end Meteor.methods
