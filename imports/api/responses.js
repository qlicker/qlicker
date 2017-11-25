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
  answerWysiwyg: Match.Maybe(String),
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

      if (!question.sessionId) return this.ready()

      const session = Sessions.findOne({ _id: question.sessionId })
      const course = Courses.findOne({ _id: session.courseId })

      if (user.isInstructor(course._id)) {
        return Responses.find({ questionId: questionId })
      } else if (user.hasRole(ROLES.student)) {

      //If stats is true for the question, publish all responses initially, otherwise, only the user's
      const initialRs = question.sessionOptions && question.sessionOptions.stats ?
                        Responses.find({ questionId: questionId }) :
                        Responses.find({ questionId: questionId,  studentUserId:this.userId  })
      initialRs.forEach(r => {
        if (r.studentUserId === this.userId){
          this.added('responses', r._id, r)
        } else {
          this.added('responses', r._id, _(r).omit('studentUserId'))
        }
      })
      this.ready()

      // observe changes on the question, and publish all responses if stats option gets set to true
      const self = this // not clear if we need to use self, in case this is different in the callbacks

      // A cursor to watch for new responses
      const rCursor = Responses.find({ questionId: questionId  })
      const rHandle = rCursor.observeChanges({
        // if a new response was added and stats is on, then add this response to the publication
        added: (id, fields) => {
          // if the response is from the user, added regardless
          if (fields.studentUserId === self.userId){
            self.added('responses', id, fields)
            return
          }
          // if stats is on, added a different user's response, but omit the student id
          const q = Questions.findOne({ _id: questionId })
          if(q.sessionOptions && q.sessionOptions.stats){
            self.added('responses', id, _(fields).omit('studentUserId'))
          }
        }
      })
      // A cursor to watch for changes in the stats property of the question
      const qCursor = Questions.find({ _id: questionId })
      const qHandle = qCursor.observeChanges({
      // if the question changed, and stats is true, add all responses to the publication
        changed: (id, fields) => {
          if (fields.sessionOptions && fields.sessionOptions.stats){
            const currentRs = Responses.find({ questionId: questionId })
            currentRs.forEach(r => {
              self.added('responses', r._id, _(r).omit('studentUserId'))
            })
          }else{
            /*
            // TODO Remove docs if stat is turned back off. The code below fails if stats is on and the attempt number changes
            // because it tries to remove docs that aren't there, which gives a server error.
            const otherRs = Responses.find({ questionId: questionId,  studentUserId: {$ne: self.userId}  })
            otherRs.forEach(r => {
              self.removed('responses', r._id, r)
            })*/
          }
        }
      })
      this.onStop(function () {
        qHandle.stop()
        rHandle.stop()
      })

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
/*
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

    responseObject.mark = mark*/
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
    }, { $set: { answer: responseObject.answer, answerWysiwyg: responseObject.answerWysiwyg } })
  }

}) // end Meteor.methods
