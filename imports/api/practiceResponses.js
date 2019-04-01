// QLICKER
// Author: Jacob Huschilt
//
// practiceResponses.js: JS related to practice question responses

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { Questions } from './questions'

import { _ } from 'underscore'

import Helpers from './helpers.js'

import { PracticeSessions } from './practiceSessions'
import { Responses } from './responses'

// expected collection pattern
const practiceResponsePattern = {
  _id: Match.Maybe(Helpers.MongoID),
  questionId: Helpers.MongoID,
  studentUserId: Helpers.MongoID,
  answer: Helpers.AnswerItem,
  answerWysiwyg: Match.Maybe(String),
  correct: Match.Maybe(Boolean), // whether or not this response was correct (used in a quiz with multiple attempts)
  createdAt: Date, // when the practice response was created, used for auto-deletion index
  updatedAt: Match.Maybe(Date),
  editable: Match.Maybe(Boolean), // whether the response can be updated (e.g. in a quiz setting)
  practiceSessionId: Helpers.MongoID // Id of practice session that the response is associated with
}

// Create Response class
const PracticeResponse = function (doc) { _.extend(this, doc) }
_.extend(PracticeResponse.prototype, {})

// Create Responses collection
export const PracticeResponses = new Mongo.Collection('practiceResponses',
  { transform: (doc) => { return new PracticeResponse(doc) } })

// data publishing
if (Meteor.isServer) {
  // questions in a specific question
  Meteor.publish('practiceResponses.forQuestion', function (questionId) {
    check(questionId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const question = Questions.findOne({ _id: questionId })

      if (user.isInstructor(question.courseId)) {
        return PracticeResponses.find({ questionId: questionId })
      } else if (user.isStudent(question.courseId)) {
        // If stats is true for the question, publish all responses initially, otherwise, only the user's
        const initialRs = question.sessionOptions && question.sessionOptions.stats
          ? PracticeResponses.find({ questionId: questionId })
          : PracticeResponses.find({ questionId: questionId, studentUserId: this.userId })
        initialRs.forEach(r => {
          if (r.studentUserId === this.userId) {
            this.added('responses', r._id, r)
          } else {
            this.added('responses', r._id, _(r).omit('studentUserId'))
          }
        })
        this.ready()

        // observe changes on the question, and publish all responses if stats option gets set to true
        const self = this // not clear if we need to use self, in case this is different in the callbacks

        // A cursor to watch for new responses
        const rCursor = PracticeResponses.find({ questionId: questionId })
        const rHandle = rCursor.observeChanges({
          // if a new response was added and stats is on, then add this response to the publication
          added: (id, fields) => {
            // if the response is from the user, added regardless
            if (fields.studentUserId === self.userId) {
              self.added('responses', id, fields)
              return
            }
            // if stats is on, added a different user's response, but omit the student id
            const q = Questions.findOne({ _id: questionId })
            if (q.sessionOptions && q.sessionOptions.stats) {
              self.added('responses', id, _(fields).omit('studentUserId'))
            }
          }
        })
        // A cursor to watch for changes in the stats property of the question
        const qCursor = Questions.find({ _id: questionId })
        const qHandle = qCursor.observeChanges({
          // if the question changed, and stats is true, add all responses to the publication
          changed: (id, fields) => {
            if (fields.sessionOptions && fields.sessionOptions.stats) {
              const currentRs = PracticeResponses.find({ questionId: questionId })
              currentRs.forEach(r => {
                // TODO: Should double-check if this should be "changed" instead of "added"
                self.added('responses', r._id, _(r).omit('studentUserId'))
              })
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

  Meteor.publish('responses.forPracticeSession', function (practiceSessionId) {
    check(practiceSessionId, Helpers.MongoID)
    if (this.userId) {
      const practiceSession = PracticeSessions.findOne({ _id: practiceSessionId })
      if (!practiceSession) this.ready()

      return PracticeResponses.find({ practiceSessionId: practiceSessionId })
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
  'practiceResponses.add' (responseObject) {
    responseObject.createdAt = new Date()
    check(responseObject, practiceResponsePattern)

    const practiceSession = PracticeSessions.findOne({_id: responseObject.practiceSessionId})
    if (!practiceSession) throw Error('Cannot submit this response')

    const c = PracticeResponses.find({
      questionId: responseObject.questionId,
      studentUserId: responseObject.studentUserId,
      practiceSessionId: responseObject.practiceSessionId
    }).count()
    if (c > 0) return Meteor.call('practiceResponses.update', responseObject)

    return PracticeResponses.insert(responseObject)
  },

  /**
   * add a student result to question (that is attached to session)
   * @param {Response} responseObject
   */
  'practiceResponses.update' (responseObject) {
    check(responseObject, practiceResponsePattern)

    const practiceSession = PracticeSessions.findOne({_id: responseObject.practiceSessionId})
    if (!practiceSession) throw Error('Cannot submit this response')

    const practiceResponse = PracticeResponses.find({
      questionId: responseObject.questionId,
      studentUserId: responseObject.studentUserId,
      practiceSessionId: responseObject.practiceSessionId
    })
    if (!practiceResponse) throw new Meteor.Error('No response to update')

    const updatedAt = new Date()

    return PracticeResponses.update({
      questionId: responseObject.questionId,
      studentUserId: responseObject.studentUserId,
      practiceSessionId: responseObject.practiceSessionId
    }, { $set: { answer: responseObject.answer, answerWysiwyg: responseObject.answerWysiwyg, updatedAt: updatedAt } })
  },

  'practiceResponses.makeUneditable' (practiceResponseId) {
    check(practiceResponseId, Helpers.MongoID)
    const practiceResponse = PracticeResponses.findOne({ _id: practiceResponseId })
    if (Meteor.userId() !== practiceResponse.studentUserId) throw new Meteor.Error('Not authorized to update this response')
    if (practiceResponse.editable) return Responses.update({ _id: practiceResponseId }, { $set: { editable: false } })
  }
}) // end Meteor.methods
