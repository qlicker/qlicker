// QLICKER
// Author: Jacob Huschilt
//
// PracticeSessions.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import Helpers from './helpers.js'
import { PracticeResponses } from './practiceResponses'

// expected collection pattern
const practiceSessionPattern = {
  _id: Match.Maybe(Helpers.MongoID), // mongo db id
  name: Helpers.NEString, // 'Week 3 Lecture 1'
  courseId: Helpers.MongoID, // parent course, mongo db id reference
  studentId: Helpers.MongoID, // student to which session belongs, mongo db id reference
  status: Helpers.NEString, // running, done
  questions: Match.Maybe([ Match.Maybe(Helpers.MongoID) ]),
  createdAt: Date,
  currentQuestion: Match.Maybe(Helpers.MongoID),
  submittedQuiz: Match.Maybe(Boolean), // true if student has submitted quiz (used to block)
  tags: Match.Maybe([ Match.Maybe({ value: Helpers.NEString, label: Helpers.NEString, className: Match.Maybe(String) }) ])
}

// Create PracticeSession class
const PracticeSession = function (doc) { _.extend(this, doc) }
_.extend(PracticeSession.prototype, {})

// Create course collection
export const PracticeSessions = new Mongo.Collection('practiceSessions',
  { transform: (doc) => { return new PracticeSession(doc) } })
// data publishing
if (Meteor.isServer) {
  Meteor.publish('practiceSession.single', function (practiceSessionId) {
    check(practiceSessionId, Helpers.MongoID)
    if (this.userId) {
      return PracticeSessions.find({_id: practiceSessionId})
    } else {
      this.ready()
    }
  })

  Meteor.publish('practiceSessions.forCourse', function (courseId) {
    check(courseId, Helpers.MongoID)
    if (this.userId) {
      return PracticeSessions.find({courseId: courseId})
    } else {
      this.ready()
    }
  })
}

/**
 * Meteor methods for session object
 * @module sessions
 */
Meteor.methods({

  /**
   * insert new practiceSession object into PracticeSessions mongodb Collection
   * @param {PracticeSession} practiceSession
   * @returns {MongoId} new practiceSession id
   */
  'practiceSessions.create' (practiceSession) {
    practiceSession.status = 'running'
    practiceSession['createdAt'] = new Date()
    check(practiceSession, practiceSessionPattern)

    return PracticeSessions.insert(practiceSession)
  },

  'practiceSessions.submitQuiz' (practiceSessionId) {
    check(practiceSessionId, Helpers.MongoID)
    const user = Meteor.user()
    if (!user) throw new Meteor.Error('No such user')
    let practiceSession = PracticeSessions.findOne({ _id: practiceSessionId })

    if (!practiceSession) throw new Meteor.Error('No session with this id')
    if ('submittedQuiz' in practiceSession && _(practiceSession.submittedQuiz).contains(user._id)) throw new Meteor.Error('User already submitted quiz')

    const responseIds = _(PracticeResponses.find({questionId: { $in: practiceSession.questions }, studentUserId: Meteor.userId(), practiceSessionId: practiceSessionId}).fetch()).pluck('_id')

    const nQ = responseIds.length
    for (let i = 0; i < nQ; i++) {
      Meteor.call('practiceResponses.makeUneditable', responseIds[i])
    }

    return PracticeSessions.update({ _id: practiceSessionId }, {$set: { submittedQuiz: true }})
  }
}) // end Meteor.methods
