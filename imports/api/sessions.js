// QLICKER
// Author: Enoch T <me@enocht.am>
//
// sessions.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import { Courses, profHasCoursePermission } from './courses.js'
import { Grades } from './grades.js'

import Helpers from './helpers.js'

import { ROLES } from '../configs'

// expected collection pattern
const sessionPattern = {
  _id: Match.Maybe(Helpers.MongoID), // mongo db id
  name: Helpers.NEString, // 'Week 3 Lecture 1'
  description: String, // 'Quiz about stuff'
  courseId: Helpers.MongoID, // parent course, mongo db id reference
  status: Helpers.NEString, // hidden, visible, running, done
  quiz: Boolean, // true = quiz mode, false = (default) lecture session,
  date: Match.Optional(Match.OneOf(undefined, null, Date)), // planned session date
  questions: Match.Maybe([ Match.Maybe(Helpers.MongoID) ]),
  createdAt: Date,
  currentQuestion: Match.Maybe(Helpers.MongoID),
  joined: Match.Maybe([ Match.Maybe(Helpers.MongoID) ]),
  tags: Match.Maybe([ Match.Maybe({ value: Helpers.NEString, label: Helpers.NEString, className: Match.Maybe(String) }) ]),
  reviewable: Match.Maybe(Boolean)
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
      if ( user.isInstructorAnyCourse() ) {
        const courseIdArray = user.profile.courses || []
        return Sessions.find({ courseId: { $in: courseIdArray } })
      } else if (user.hasGreaterRole(ROLES.prof)) {
        const courseIdArray = _(Courses.find({ instructors: user._id }).fetch()).pluck('_id') || []
        return Sessions.find({ courseId: { $in: courseIdArray } })
      } else if (user.hasRole(ROLES.student)) {
        const courseIdArray = user.profile.courses || []
        // TODO should check, but for a student, should not need to know who joined, right?
        // return Sessions.find({ courseId: { $in: courseIdArray }, status: { $ne: 'hidden' } }, {fields: {joined: false}})
        return Sessions.find({ courseId: { $in: courseIdArray }, status: { $ne: 'hidden' } })
      }
    } else this.ready()
  })
}

/**
 * Meteor methods for session object
 * @module sessions
 */
Meteor.methods({

  /**
   * insert new session object into Sessions mongodb Collection
   * @param {Session} session
   * @returns {MongoId} new session id
   */
  'sessions.insert' (session) {
    session.status = 'hidden'
    check(session, sessionPattern)
    profHasCoursePermission(session.courseId)

    return Sessions.insert(session)
  },

  /**
   * Delete session from Sessions collection (use course.deleteSession to delete from course)
   * @param {MongoId} courseId
   * @param {MongoId} sessionId
   */
  'sessions.delete' (courseId, sessionId) {
    profHasCoursePermission(courseId)
    return Sessions.remove({ _id: sessionId })
  },

  /**
   * edit specific attributes in a sessionr record
   * @param {Session} session
   */
  'sessions.edit' (session) {
    check(session._id, Helpers.MongoID)
    if (!session.tags) session.tags = []
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
        reviewable: session.reviewable,
        date: session.date || undefined,
        tags: session.tags || undefined
      }
    })
  },

  /**
   * Copies a question from your library and attach to session
   * @param {MongoId} sessionId
   * @param {MongoId} questionId
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
   * remove question from a session
   * @param {MongoId} sessionId
   * @param {MongoId} questionId
   */
  'sessions.removeQuestion' (sessionId, questionId) {
    check(sessionId, Helpers.MongoID)
    check(questionId, Helpers.MongoID)

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    // TODO if question was a copy attached to session (should be all), delete question from db
    // Currently orphans questions
    // -- or --
    // should deletion be flag based. Just keep everything incase we want to implement restore functionality

    if (session.currentQuestion === questionId) session.currentQuestion = null

    return Sessions.update({ _id: sessionId }, {
      $pull: { questions: questionId }
    })
  },

  /**
   * replaces list of attached questions with supplied list (use for reordering questions)
   * @param {MongoId} sessionId
   * @param {MongoId[]} questionIdList
   */
  'sessions.batchEdit' (sessionId, questionIdList) {
    check(sessionId, Helpers.MongoID)
    check(questionIdList, [ Helpers.MongoID ])

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, { $set: { questions: questionIdList } })
  },

  /**
   * Duplicate a session and attach to a different (or same) course
   * @param {MongoId} sessionId
   * @param {MongoId} targetCourseId
   * @returns {MongoId} new session id
   */
  'sessions.copy' (sessionId, targetCourseId = null) {
    check(sessionId, Helpers.MongoID)
    check(targetCourseId, Match.Maybe(Helpers.MongoID))

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)
    if (targetCourseId) {
      profHasCoursePermission(targetCourseId)
      session.courseId = targetCourseId
    }

    // modify session
    session.status = 'hidden'
    session.name += ' (copy)'
    session.reviewable = false

    // keep a copy of the questions
    const questions = (session.questions || []).slice()
    session.questions = []

    // insert new session and update course object
    const newSessionId = Sessions.insert(_(session).omit(['_id', 'currentQuestion', 'joined']))
    Courses.update({ _id: session.courseId }, {
      $addToSet: { sessions: newSessionId }
    })

    // create a copy of each question to new session
    questions.forEach((qId) => {
      Meteor.call('questions.copyToSession', newSessionId, qId)
    })

    return newSessionId
  },

  /**
   * Mark session as running and set first question to current
   * @param {MongoId} sessionId
   */
  'sessions.startSession' (sessionId) {
    const s = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(s.courseId)
    if (s.status === 'running') return
    return Sessions.update({ _id: sessionId }, { $set: { currentQuestion: s.questions[0] } })
  },

  /**
   * Mark session as done
   * @param {MongoId} sessionId
   */
  'sessions.endSession' (sessionId) {
    const s = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(s.courseId)
    return Sessions.update({ _id: sessionId }, { $set: { status: 'done' } })
  },

  /**
   * track each student that joins a session. Used to track all students that have participated in a session
   * @param {MongoId} sessionId
   * @param {MongoId} studentUserId
   */
  'sessions.join' (sessionId, studentUserId) {
    check(sessionId, Helpers.MongoID)
    check(studentUserId, Helpers.MongoID)

    // const session = Sessions.findOne({ _id: sessionId })
    // TODO only allow students enrolled in course to join a session

    return Sessions.update({ _id: sessionId }, {
      $addToSet: { joined: studentUserId }
    })
  },

  /**
   * set currently running question
   * @param {MongoId} sessionId
   * @param {MongoId} questionId
   */
  'sessions.setCurrent' (sessionId, questionId) {
    check(questionId, Helpers.MongoID)
    check(sessionId, Helpers.MongoID)

    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, {
      $set: {
        currentQuestion: questionId
      }
    })
  },

  /**
   * toggles the ability for students to review previous sessions
   * @param {MongoId} sessionId
   */
  'sessions.toggleReviewable' (sessionId) {
    check(sessionId, Helpers.MongoID)
    const session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)

    /*
    // TODO: Calculate grades if the session is made reviewable 
    // for some reasone, doesn't find any grades, even if they exist!!!


    const grades = Grades.find({ sessionId: session._id }).fetch()
    const calcGrades =  (grades.length < 1 && !session.reviewable )

    // If making the session reviewable, calculate the grades
    if (calcGrades && session) {
      console.log("calculating grades")
      console.log(grades)
      console.log(session._id)
      Meteor.call('grades.calcSessionGrades',session._id, (err) => {
        if(err){
          alertify.error('Error: ' + err.error)
        }
      })
    }
   */
    return Sessions.update({ _id: sessionId }, {
      $set: {
        reviewable: !session.reviewable
      }
    })
  },

  /**
   * returns a list of autocomplete tag sugguestions specific for session (different than questions)
   * @returns {String[]} array of string tags
   */
  'sessions.possibleTags' () {
    let tags = new Set()

    const courses = Courses.find({ instructors: Meteor.userId() }).fetch() || []
    courses.forEach(c => {
      tags.add(c.courseCode().toUpperCase())
    })

    const profSessions = Sessions.find({ courseId: { $in: _(courses).pluck('_id') } }).fetch()
    profSessions.forEach((s) => {
      const tList = s.tags || []
      tList.forEach((t) => {
        tags.add(t.label.toUpperCase())
      })
    })

    return [...tags]
  }

}) // end Meteor.methods
