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
  createdAt: Date
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

  'sessions.insert' (session) {
    session.status = 'hidden'
    check(session, sessionPattern)
    profHasCoursePermission(session.courseId)

    return Sessions.insert(session)
  },

  'sessions.delete' (courseId, sessionId) {
    profHasCoursePermission(courseId)
    return Sessions.remove({ _id: sessionId })
  },

  'sessions.edit' (session) {
    check(session._id, Helpers.MongoID)
    check(session, sessionPattern)

    profHasCoursePermission(session.courseId)

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

  'sessions.addQuestion' (sessionId, questionId) {
    check(sessionId, Helpers.MongoID)
    check(questionId, Helpers.MongoID)

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, {
      $addToSet: { questions: questionId }
    })
  },

  'sessions.removeQuestion' (sessionId, questionId) {
    check(sessionId, Helpers.MongoID)
    check(questionId, Helpers.MongoID)

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, {
      $pull: { questions: questionId }
    })
  }


}) // end Meteor.methods
