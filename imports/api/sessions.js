// QLICKER
// Author: Enoch T <me@enocht.am>
//
// sessions.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import { Courses, profHasCoursePermission } from './courses.js'
import Helpers from './helpers.js'

// expected collection pattern
const sessionPattern = {
  _id: Match.Maybe(Helpers.MongoID), // mongo db id
  name: Helpers.NEString, // 'Week 3 Lecture 1'
  description: String, // 'Quiz about stuff'
  courseId: Helpers.MongoID, // parent course, mongo db id reference
  status: Helpers.NEString, // hidden, visible, running, done
  quiz: Boolean, // true = quiz mode, false = (default) lecture session,
  dueDate: Match.Optional(Match.OneOf(undefined, null, Date)), // quiz due date
  questions: Match.Maybe([ Match.Maybe(Helpers.MongoID) ]),
  createdAt: Date,
  currentQuestion: Match.Maybe(Helpers.MongoID)
}

// Create Session class
const Session = function (doc) { _.extend(this, doc) }
_.extend(Session.prototype, {})

// Create course collection
export const Sessions = new Mongo.Collection('sessions',
  { transform: (doc) => { return new Session(doc) } })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('sessions', function () {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole('professor')) {
        const courseIdArray = _(Courses.find({ owner: user._id }).fetch()).pluck('_id') || []
        return Sessions.find({ courseId: { $in: courseIdArray } })
      } else if (user.hasRole('student')) {
        const courseIdArray = user.profile.courses || []
        return Sessions.find({ courseId: { $in: courseIdArray }, status: { $ne: 'hidden' } })
      }
    } else this.ready()
  })
}

// data methods
Meteor.methods({

  /**
   * sessions.insert(Session: session)
   * insert new session object into Sessions mongodb Collection
   */
  'sessions.insert' (session) {
    session.status = 'hidden'
    check(session, sessionPattern)
    profHasCoursePermission(session.courseId)

    return Sessions.insert(session)
  },

  /**
   * sessions.delete(MongoId (string) courseId, MongoId (string) sessionId)
   * Delete session from Sessions collection (use course.deleteSession to delete from course)
   */
  'sessions.delete' (courseId, sessionId) {
    profHasCoursePermission(courseId)
    return Sessions.remove({ _id: sessionId })
  },

  /**
   * sessions.edit(Session: session)
   * edit all valid attributes is session object
   */
  'sessions.edit' (session) {
    check(session._id, Helpers.MongoID)
    check(session, sessionPattern)

    profHasCoursePermission(session.courseId)

    if (session.status === 'running') Meteor.call('sessions.startSession', session._id)
    else Meteor.call('sessions.endSession', session._id)

    return Sessions.update({ _id: session._id }, {
      $set: {
        name: session.name,
        description: session.description,
        status: session.status,
        quiz: session.quiz,
        dueDate: session.dueDate || undefined
      }
    })
  },

  /**
   * sessions.addQuestion(MongoId (string) sessionId, MongoId (string) questionId)
   * copy question from library and attach to session
   */
  'sessions.addQuestion' (sessionId, questionId) {
    check(sessionId, Helpers.MongoID)
    check(questionId, Helpers.MongoID)

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, {
      $addToSet: { questions: questionId }
    })
  },

  /**
   * sessions.removeQuestion(MongoId (string) sessionId, MongoId (string) questionId)
   * remove question from a session
   */
  'sessions.removeQuestion' (sessionId, questionId) {
    check(sessionId, Helpers.MongoID)
    check(questionId, Helpers.MongoID)

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    // TODO if question was a copy attached to session (should be all), delete question from db
    // Currently orphans questions

    return Sessions.update({ _id: sessionId }, {
      $pull: { questions: questionId }
    })
  },

  /**
   * sessions.batchEdit(MongoId (string) sessionId, [MongoId (string)] questionIdList)
   * replaces list of attached questions with supplied list (use for reordering questions)
   */
  'sessions.batchEdit' (sessionId, questionIdList) {
    check(sessionId, Helpers.MongoID)
    check(questionIdList, [ Helpers.MongoID ])

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, { $set: { questions: questionIdList } })
  },

  /**
   * sessions.startSession(MongoId (string) sessionId)
   * mark session as active and set first question to current
   */
  'sessions.startSession' (sessionId) {
    const s = Sessions.findOne({ _id: sessionId })
    return Sessions.update({ _id: sessionId }, { $set: { currentQuestion: s.questions[0] } })
  },

  /**
   * sessions.endSession(MongoId (string) sessionId)
   * mark session as done and clear currentQuestion
   */
  'sessions.endSession' (sessionId) {
    return Sessions.update({ _id: sessionId }, { $unset: { currentQuestion: '' } })
  },

  /**
   * sessions.setCurrent(MongoId (string) sessionId, MongoId (string) questionId)
   * set currently running question
   */
  'sessions.setCurrent' (sessionId, questionId) {
    check(questionId, Helpers.MongoID)

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, {
      $set: {
        currentQuestion: questionId
      }
    })
  }

}) // end Meteor.methods
