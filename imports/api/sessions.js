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
import { Responses } from './responses.js'

import moment from 'moment-timezone'
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
  quizStart:Match.Maybe(Match.OneOf(undefined, null, Date)), // quiz start time
  quizEnd:  Match.Maybe(Match.OneOf(undefined, null, Date)),  // quiz end time
  questions: Match.Maybe([ Match.Maybe(Helpers.MongoID) ]),
  createdAt: Date,
  currentQuestion: Match.Maybe(Helpers.MongoID),
  joined: Match.Maybe([ Match.Maybe(Helpers.MongoID) ]),
  submittedQuiz: Match.Maybe([ Match.Maybe(Helpers.MongoID) ]), //true if student has submitted quiz (used to block)
  tags: Match.Maybe([ Match.Maybe({ value: Helpers.NEString, label: Helpers.NEString, className: Match.Maybe(String) }) ]),
  reviewable: Match.Maybe(Boolean)
}

// Create Session class
const Session = function (doc) { _.extend(this, doc) }
// Add some methods:
_.extend(Session.prototype, {
  gradesViewable: function () {
    let grades = Grades.find({ sessionId: this._id, visibleToStudents: true }).fetch()
    return grades.length > 0
  },

  quizCompleted: function (userId) {
    return this.quiz && this.submittedQuiz && _(this.submittedQuiz).contains(userId)
  },

  // check if quiz is currently active (iether 'running' or visible and it's the correct time)
  quizIsActive: function () {
    if (!this.quiz) return false;
    if (this.status === 'running') return true;
    if (!this.quizStart || !this.quizEnd) return false;
    if (this.status === 'hidden' || this.status === 'done') return false

    const currentTime = Date.now()
    const isPastStart = currentTime > this.quizStart
    const isBeforeEnd = currentTime < this.quizEnd
    return isPastStart && isBeforeEnd
  },

  quizIsClosed: function () {
    if (!this.quiz) return false;
    if (this.status === 'running') return false;
    if (this.status === 'hidden' || this.status === 'done') return true
    if (!this.quizEnd) return false;
    const currentTime = Date.now()
    const isBeforeEnd = currentTime < this.quizEnd
    return !isBeforeEnd
  },
})

// Create course collection
export const Sessions = new Mongo.Collection('sessions',
  { transform: (doc) => { return new Session(doc) } })
// data publishing
if (Meteor.isServer) {

  Meteor.publish('sessions.forCourse', function (courseId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const course = Courses.findOne({ _id: courseId })
      if (!course || !user) return this.ready()

      if (user.isInstructor(courseId) || user.hasGreaterRole(ROLES.admin)) {
        return Sessions.find({ courseId: courseId })
      } else if (user.isStudent(courseId)) {
        //Initial publications:
        let sessions = Sessions.find({ courseId: courseId, status: { $ne: 'hidden' }}).fetch()
        sessions.forEach( sess => {
          sess.joined = sess.joined && _(sess.joined).contains(this.userId) ? [this.userId] : []
          sess.submittedQuiz = sess.quiz && sess.submittedQuiz && _(sess.submittedQuiz).contains(this.userId) ? [this.userId] : []
          this.added('sessions', sess._id, sess)
        })
        this.ready()
        //Watch for changes
        const sCursor = Sessions.find({ courseId: courseId, status: { $ne: 'hidden' } })
        const sHandle = sCursor.observeChanges({
          added: (id, fields) => {
            let newfields = fields
            newfields.joined = fields.joined && _(fields.joined).contains(this.userId) ? [this.userId] : []
            newfields.submittedQuiz = fields.quiz && fields.submittedQuiz && _(fields.submittedQuiz).contains(this.userId) ? [this.userId] : []
            this.added('sessions', id, newfields)
          },
          changed: (id, fields) => {
            let newfields = fields
            if ('joined' in fields) newfields.joined = _(fields.joined).contains(this.userId) ? [this.userId] : []
            if ('submittedQuiz' in fields) newfields.submittedQuiz =  _(fields.submittedQuiz).contains(this.userId) ? [this.userId] : []
            this.changed('sessions', id, newfields)
          },
          removed: (id) => {
            this.removed('sessions', id)
          }
        })

        this.onStop(function () {
          sHandle.stop()
        })
        //////////////////////////////////////////////////////////////
        //return Sessions.find({ courseId: courseId, status: { $ne: 'hidden' } }, {fields: {joined: false}})
      } else {
        return this.ready()
      }
    } else this.ready()
  })

  Meteor.publish('sessions.single', function (sessionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const session = Sessions.findOne({_id: sessionId})
      if (!session || !user) return this.ready()
      const courseId = session.courseId

      if (user.isInstructor(courseId) || user.hasGreaterRole(ROLES.admin)) {
        return Sessions.find({_id: sessionId})
      } else if (user.isStudent(courseId)) {
        //Initial publication of the session
        let sess = Sessions.findOne({ _id: sessionId, status: { $ne: 'hidden' } })
        if (!sess) this.ready()
        else {
          sess.joined = sess.joined && _(sess.joined).contains(this.userId) ? [this.userId] : []
          sess.submittedQuiz = sess.quiz && sess.submittedQuiz && _(sess.submittedQuiz).contains(this.userId) ? [this.userId] : []
          if (sess.status !== 'hidden') this.added('sessions', sess._id, sess)
          this.ready()
        }
        //Watch for changes
        const sCursor = Sessions.find({ _id: sessionId, status: { $ne: 'hidden' } })
        const sHandle = sCursor.observeChanges({
          added: (id, fields) => {
            let newfields = fields
            newfields.joined = fields.joined && _(fields.joined).contains(this.userId) ? [this.userId] : []
            newfields.submittedQuiz = fields.quiz && fields.submittedQuiz && _(fields.submittedQuiz).contains(this.userId) ? [this.userId] : []
            this.added('sessions', id, newfields)
          },
          changed: (id, fields) => {
            let newfields = fields
            if ('joined' in fields) newfields.joined =  _(fields.joined).contains(this.userId) ? [this.userId] : []
            if ('submittedQuiz' in fields) newfields.submittedQuiz =  _(fields.submittedQuiz).contains(this.userId) ? [this.userId] : []
            this.changed('sessions', id, newfields)
          },
          removed: (id) => {
            this.removed('sessions', id)
          }
        })

        this.onStop(function () {
          sHandle.stop()
        })
        //////////////////////////////////////////////////////////////
        //return Sessions.find({ _id: sessionId, status: { $ne: 'hidden' } }, {fields: {joined: false}})
      } else {
        return this.ready()
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

    return Sessions.update({ _id: session._id }, { $set: _.omit(session, '_id') })

    /*return Sessions.update({ _id: session._id }, {
      $set: {
        name: session.name,
        description: session.description,
        status: session.status,
        quiz: session.quiz,
        quizStart: session.quizStart || undefined,
        quizEnd: session.quizEnd || undefined,
        reviewable: session.reviewable,
        date: session.date || undefined,
        tags: session.tags || undefined
      }
    })*/
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
    Meteor.call('questions.delete', questionId)
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
    const newSessionId = Sessions.insert(_(session).omit(['_id', 'currentQuestion', 'joined', 'submittedQuiz']))
    Courses.update({ _id: session.courseId }, {
      $addToSet: { sessions: newSessionId }
    })

    // create a copy of each question to new session
    Meteor.call('questions.hideQuestion',questions[0],()=>{
      questions.forEach((qId) => {
        Meteor.call('questions.copyToSession', newSessionId, qId)
      })
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
    return Sessions.update({ _id: sessionId }, { $set: { currentQuestion: s.questions[0], status: 'running' } })
  },

  /**
   * Mark session as done
   * @param {MongoId} sessionId
   */
  'sessions.endSession' (sessionId) {
    let session = Sessions.findOne({ _id: sessionId })
    profHasCoursePermission(session.courseId)
    if (!session.date)  session.date = moment().toDate()
    session.status = 'done'

    return Sessions.update({ _id: sessionId }, { $set: session })
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
    if (!session) {
      throw Error('No session with this id')
    }
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, {$set: { reviewable: !session.reviewable }}, () => {
      // If making the session reviewable, calculate/update the grades
      if (!session.reviewable) {
        Meteor.call('grades.calcSessionGrades', session._id)
      } else { // If the session is made non-reviewable, hide the grades from students
        const grades = Grades.find({ sessionId: session._id }).fetch()
        if (grades.length > 0) {
          Meteor.call('grades.hideFromStudents', session._id)
        }
      }
    })
  },

  /**
   * toggles whether the session is a quiz
   * @param {MongoId} sessionId
   */
  'sessions.toggleQuizMode' (sessionId) {
    check(sessionId, Helpers.MongoID)
    const session = Sessions.findOne({ _id: sessionId })
    if (!session) {
      throw Error('No session with this id')
    }
    profHasCoursePermission(session.courseId)

    return Sessions.update({ _id: sessionId }, {$set: { quiz: !session.quiz }})
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
  },

  'sessions.submitQuiz' (sessionId) {
    check(sessionId, Helpers.MongoID)
    const user = Meteor.user()
    if(!user) throw new Meteor.Error('No such user')
    let session = Sessions.findOne({ _id: sessionId })

    if (!session)  throw new Meteor.Error('No session with this id')
    if (!session.quiz) throw new Meteor.Error('Not a quiz')
    if (!user.isStudent(session.courseId)) throw new Meteor.Errorr('User is not a student in course')
    if (Meteor.isServer && ! _(session.joined).contains(user._id) ) throw new Meteor.Error('User did not start quiz')
    if ( 'submittedQuiz' in session && _(session.submittedQuiz).contains(user._id)) throw new Meteor.Error('User already submitte quiz')

    const responseIds = _(Responses.find({ questionId: { $in: session.questions }, studentUserId: Meteor.userId(), attempt: 1 }).fetch()).pluck('_id')

    if (responseIds.length !== session.questions.length) throw new Meteor.Error('Must answer all questions to submit quiz')

    const nQ = session.questions.length
    for (let i = 0; i<nQ ; i++){
      Meteor.call('responses.makeUneditable', responseIds[i])
    }
    if (session.submittedQuiz) session.submittedQuiz.push(user._id)
    else session.submittedQuiz = [user._id]

    return Sessions.update({ _id: sessionId }, {$set: { submittedQuiz: session.submittedQuiz }})
  }

}) // end Meteor.methods
