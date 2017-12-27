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
import { calculateResponsePoints } from './grades'

import { _ } from 'underscore'

import Helpers from './helpers.js'

import { ROLES, QUESTION_TYPE } from '../configs'

// expected collection pattern
const responsePattern = {
  _id: Match.Maybe(Helpers.MongoID),
  attempt: Number, // number of the attempt
  questionId: Helpers.MongoID,
  studentUserId: Helpers.MongoID,
  answer: Helpers.AnswerItem,
  answerWysiwyg: Match.Maybe(String),
  correct: Match.Maybe(Boolean), // whether or not this response was correct (used in a quiz with multiple attempts)
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
      } else if (user.isStudent(course._id)) {

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
              // TODO: Should double-check if this should be "changed" instead of "added"
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
      } else if (user.isStudent(course._id)) {
      // return Responses.find({ questionId: { $in: session.questions }, studentUserId: this.userId })

      //If stats is true for the question, publish all responses initially, otherwise, only the user's
      const initialRs = Responses.find({ questionId: { $in: session.questions } })
      initialRs.forEach(r => {
        const q = Questions.findOne({ _id: r.questionId })
        if (r.studentUserId === this.userId){
          this.added('responses', r._id, r)
        } else if (q.sessionOptions && q.sessionOptions.stats) {
          this.added('responses', r._id, _(r).omit('studentUserId'))
        } else {}

      })
      this.ready()

      // observe changes on the question, and publish all responses if stats option gets set to true
      // A cursor to watch for new responses
      const self = this
      const rCursor = Responses.find({ questionId: { $in: session.questions }  })
      const rHandle = rCursor.observeChanges({
        // if a new response was added and stats is on, then add this response to the publication
        added: (id, fields) => {
          // if the response is from the user, added regardless
          if (fields.studentUserId === self.userId){
            self.added('responses', id, fields)
            return
          }
          // if stats is on, added a different user's response, but omit the student id
          const q = Questions.findOne({ _id: fields.questionId })
          if(q && q.sessionOptions && q.sessionOptions.stats){
            self.added('responses', id, _(fields).omit('studentUserId'))
          }
        }
      })
      // A cursor to watch for changes in the stats property of the questions
      const qCursor = Questions.find({ _id: { $in: session.questions } })
      const qHandle = qCursor.observeChanges({
      // if the question changed, and stats is true, add all responses from other users to the publication
        changed: (id, fields) => {
          if (fields.sessionOptions && fields.sessionOptions.stats){
            const currentRs = Responses.find({ questionId: id })
            currentRs.forEach(r => {
              // TODO: Should double-check if this should be "changed" instead of "added"
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

  Meteor.publish('responses.forCourse', function (courseId) {
    check(courseId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })

      const sessions = Sessions.find({ courseId: courseId }).fetch()
      const questionIds = _.flatten(_(sessions).pluck('questions'))

      if (user.isInstructor(courseId)) {
        return Responses.find({ questionId: { $in: questionIds } })
      } else if (user.isStudent(courseId)) {
        return Responses.find({ questionId: { $in: questionIds }, studentUserId: this.userId })
      }
    } else this.ready()
  })
}

/**
 * Computes the distribution of the answers from the array of response objects
 * @param {Array} allResponses - array of response objects
 * @param {Question} question - the question object for the responses
 * @param {Number} attemptNumber - attempt number for which to calculate (-1 to calculate all)
 */
export const responseDistribution =  (allResponses, question, attemptNumber = -1) => {

  const session = Sessions.findOne({ questions: question._id})
  if (!session || !question.sessionOptions) return []

  const courseId = session.courseId
  const user = Meteor.user()

  if (!user.isStudent(courseId) && !user.isInstructor(courseId)) return []
  if (user.isStudent(courseId) && !question.sessionOptions.stats ) return []

  const responsesByAttempt = _(_(allResponses).where({ questionId: question._id })).groupBy('attempt')
  let responseStats = []
  // Loop over all attempts
  _(responsesByAttempt).keys().forEach( (aNumber) => {
    if (attemptNumber !== -1 && aNumber !== attemptNumber){
      return //this is like continue, needs to be used in a forEach statement...
    }
    let responses = responsesByAttempt[aNumber]
    if (responses && question.type !== QUESTION_TYPE.SA) {
      // Get the valid options for the question (e.g A, B, C)
      const validOptions = _(question.options).pluck('answer')
      // Get the total number of responses:
      const total = responses.length
      let answerDistribution = {}
      // pull out all the answers from the responses, this gives an array of arrays of answers
      // e.g. [[A,B], [B], [B,C]], then flatten it
      let allAnswers = _(_(responses).pluck('answer')).flatten()
      // then we count each occurrence of answer in the array
      // we add a new key to answerDistribution if it that answer doesn't exist yet, or increment otherwise
      allAnswers.forEach((a) => {
        if (answerDistribution[a]) answerDistribution[a] += 1
        else answerDistribution[a] = 1
      })

      validOptions.forEach((o) => {
        if (!answerDistribution[o]) answerDistribution[o] = 0
        let pct = Math.round(100.0 * (total !== 0 ? answerDistribution[o] / total : 0))
        // counts does not need to be an array, but leave the flexibility to be able to hold
        // the values for more than one attempt
        //responseStats.push({ answer: o, counts: [ {attempt: attemptNumber, count: answerDistribution[o], pct: pct} ] })
        responseStats.push({ answer: o, counts: answerDistribution[o], total:total, pct:pct, attempt:aNumber})
      })
    }
  })

  return responseStats
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

    // If this is a response in a quiz where the question has multiple possible attempts,
    // check if this answer is correct
    if (q.sessionOptions && q.sessionOptions.maxAttempts > 1 && responseObject.attempt <= q.sessionOptions.maxAttempts && Meteor.isServer){
      session = Sessions.findOne({ _id:q.sessionId })
      responseObject.correct = (calculateResponsePoints(responseObject) === q.sessionOptions.points)
    }

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
