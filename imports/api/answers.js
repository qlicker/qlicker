/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// sessions.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { Courses } from './courses'
import { Sessions } from './sessions'
import { Questions } from './questions'

import { _ } from 'underscore'
import dl from 'datalib'

import Helpers from './helpers.js'
import { QUESTION_TYPE, TF_ORDER, MC_ORDER } from '../configs'

// expected collection pattern
const answerPattern = {
  _id: Match.Maybe(Helpers.MongoID),
  attempt: Number,
  questionId: Helpers.MongoID,
  studentUserId: Helpers.MongoID,
  answer: Helpers.AnswerItem,
  createdAt: Date
}

// Create Answer class
const Answer = function (doc) { _.extend(this, doc) }
_.extend(Answer.prototype, {})

// Create answers collection
export const Answers = new Mongo.Collection('answers',
  { transform: (doc) => { return new Answer(doc) } })

// data publishing
if (Meteor.isServer) {
  // questions in a specific question
  Meteor.publish('answers.forQuestion', function (questionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const question = Questions.findOne({ _id: questionId })
      const session = Sessions.findOne({ _id: question.sessionId })
      const course = Courses.findOne({ _id: session.courseId })

      if (user.hasRole('professor') && course.owner === this.userId) {
        return Answers.find({ questionId: questionId })
      } else if (user.hasRole('student')) {
        return Answers.find({ questionId: questionId })
      }
    } else this.ready()
  })

  Meteor.publish('answers.forSession', function (sessionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const session = Sessions.findOne({ _id: sessionId })
      const course = Courses.findOne({ _id: session.courseId })

      if (user.hasRole('professor') && course.owner === this.userId) {
        return Answers.find({ questionId: { $in: session.questions } })
      } else if (user.hasRole('student')) {
        return Answers.find({ questionId: { $in: session.questions } })
      }
    } else this.ready()
  })

  Meteor.publish('answers.forCourse', function (courseId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const course = Courses.findOne({ _id: courseId })

      const questionIds = []
      const sessions = Sessions.find({ _id: (course.sessions || []).pluck('sessionId') }).fetch()
      sessions.forEach((s) => {
        Questions.find().fetch().forEach((q) => {
          questionIds.push(q._id)
        })
      })

      if (user.hasRole('professor') && course.owner === this.userId) {
        return Answers.find({ questionId: { $in: questionIds } })
      } else if (user.hasRole('student')) {
        return Answers.find({ questionId: { $in: questionIds } })
      }
    } else this.ready()
  })
}

// data methods
Meteor.methods({

  /**
   * answer.addQuestionAnswer(Answer answerObject)
   * add a student result to question (that is attached to session)
   */
  'answer.addQuestionAnswer' (answerObject) {
    answerObject.createdAt = new Date()
    check(answerObject, answerPattern)

    const q = Questions.findOne({ _id: answerObject.questionId })
    if (!q.sessionId) throw Error('Question not attached to session')
    if (Meteor.userId() !== answerObject.studentUserId) throw Error('Cannot submit answer')

    // TODO check if attempt number is current in question

    const c = Answers.find({
      attempt: answerObject.attempt,
      questionId: answerObject.questionId,
      studentUserId: answerObject.studentUserId
    }).count()
    if (c > 0) return Meteor.call('answer.update', answerObject)

    return Answers.insert(answerObject)
  },

  'answer.update' (answerObject) {
    check(answerObject, answerPattern)

    return Answers.update({
      attempt: answerObject.attempt,
      questionId: answerObject.questionId,
      studentUserId: answerObject.studentUserId
    }, { $set: { answer: answerObject.answer } })
  }

}) // end Meteor.methods
