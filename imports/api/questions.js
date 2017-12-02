// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions.js: JS related to question collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { Courses } from './courses'
import { Sessions } from './sessions'

import { _ } from 'underscore'

import Helpers from './helpers.js'
import { ROLES } from '../configs'

// expected collection pattern
const questionPattern = {
  _id: Match.Maybe(Helpers.MongoID),
  plainText: String, // plain text version of question
  type: Helpers.QuestionType,
  content: String, // wysiwyg display content
  options: [ {
    wysiwyg: Boolean,
    correct: Boolean,
    answer: Helpers.NEString,
    content: String,
    plainText: String
  } ],
  creator: Helpers.MongoID,
  owner: Match.Maybe(Helpers.MongoID),
  // null if template, questionId of original once copied to question
  originalQuestion: Match.Maybe(Helpers.MongoID),
  // null if question template, sessionId if copy attached to question
  sessionId: Match.Maybe(Helpers.MongoID),
  // null if prof created, populated for students creating question for enrolled course
  courseId: Match.Maybe(Helpers.MongoID),
  // student submitted questions are always public, prof can mark question templates as public
  public: Boolean,
  createdAt: Date,
  approved: Boolean,
  tags: [ Match.Maybe({ value: Helpers.NEString, label: Helpers.NEString, className: Match.Maybe(String) }) ],
  // config stuff for use while running a session
  sessionOptions: Match.Maybe({
    hidden: Boolean, // temporarily hide question on screen
    stats: Boolean, // students able to see distribution of answers
    correct: Boolean, // students able to see which is correct
    points: Match.Maybe(Number), // number of points question is work
    attempts: [{
      number: Number,
      closed: Boolean,
      weight: Match.Maybe(Number) // weight of the attempt
    }]
  }),
  imagePath: Match.Maybe(String),
  studentCopyOfPublic: Match.Maybe(Boolean) // true if this a student's copy from a public library
}

export const defaultSessionOptions = {
  hidden: false,
  stats: false,
  correct: false,
  points: 1,
  attempts: [{
    number: 1,
    closed: false,
    weight: 0
  }]
}

// Create Question class
const Question = function (doc) { _.extend(this, doc) }
_.extend(Question.prototype, {
})

// Create question collection
export const Questions = new Mongo.Collection('questions',
  { transform: (doc) => { return new Question(doc) } })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('questions.inCourse', function (courseId) {
    if (this.userId) {
      const user = Meteor.users.findOne({_id: this.userId})
      const course = Courses.findOne({_id: courseId})
      if (user.isInstructor(courseId)) return Questions.find({ sessionId: { $in: course.sessions || [] } })

      if (user.hasRole(ROLES.student)) {
        return Questions.find({ sessionId: { $in: course.sessions || [] } }, { fields: { 'options.correct': false } })
      }
    } else this.ready()
  })

  // questions for reviewing a session (sends the correct flag)
  // only send to students if the reviewable flag is turned on
  Meteor.publish('questions.forReview', function (sessionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({_id: this.userId})
      const session = Sessions.findOne({_id: sessionId})

      if (user.hasRole(ROLES.admin) || user.isInstructor(session.courseId)){
        return Questions.find({ sessionId: sessionId })
      }
      if (user.hasRole(ROLES.student)) {
        if (session.reviewable) {
          return Questions.find({ sessionId: sessionId })
        } else{
          return this.ready()
        }
      }

      return Questions.find({ sessionId: sessionId })
    } else this.ready()
  })

  // questions in a specific session
  // TODO: For Short answer, cannot send options[0].content, since that is the solution!!!
  // TODO: Should move the solution to options.correct for SA???
  Meteor.publish('questions.inSession', function (sessionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({_id: this.userId})
      const session = Sessions.findOne({_id: sessionId})
      if (user.isInstructor(session.courseId)) return Questions.find({ sessionId: sessionId })

      if (user.hasRole(ROLES.student)) {
        // by default fetch all Qs without correct indicator
        const initialQs = Questions.find({ sessionId: sessionId }, { fields: { 'options.correct': false } }).fetch()

        initialQs.forEach(q => {
          const qToAdd = q
          // if prof has marked Q with correct visible, refetch answer options
          if (q.sessionOptions && q.sessionOptions.correct) qToAdd.options = Questions.findOne({_id: q._id}).options
          this.added('questions', qToAdd._id, qToAdd)
        })

        this.ready()

        // need to monitor for changes on sessionOptions.correct
        // and expose options.correct based on that
        const questionsCursor = Questions.find({ sessionId: sessionId })
        const handle = questionsCursor.observeChanges({
          added: (id, fields) => {
            this.added('questions', id, fields)
          },
          changed: (id, fields) => {
            const newFields = fields

            const so = newFields.sessionOptions
            if (so && so.correct) { // correct should be visible
              const q = Questions.findOne({_id: id})
              newFields['options'] = q.options
            } else if (so && !so.correct) { // correct should be hidden
              const q = Questions.findOne({ _id: id }, { fields: { 'options.correct': false } })
              newFields['options'] = q.options
            }

            this.changed('questions', id, newFields)
          },
          removed: (id) => {
            this.removed('questions', id)
          }
        })

        this.onStop(function () {
          handle.stop()
        })
      }
    } else this.ready()
  })

  // question library for a user (student can see those they own or created)
  Meteor.publish('questions.library', function () {
    if (this.userId) {
      const user = Meteor.users.findOne({_id: this.userId})
      if (user.hasRole(ROLES.admin)) {
        return Questions.find({
          approved: true,
          studentCopyOfPublic: {$exists: false},
          sessionId: {$exists: false} })
      } else if (user.isInstructorAnyCourse()) {
        const courses = _.pluck(Courses.find({instructors: this.userId}).fetch(), '_id')
        return Questions.find({
          '$or': [{owner: this.userId}, {courseId: { '$in': courses }, approved: true}],
          studentCopyOfPublic: {$exists: false},
          sessionId: {$exists: false} })
      } else {
        // students. By checking for creator, they can see the questions they submitted
        // that have been moved to a course library (which changes the owner w/o copying)
        return Questions.find({
          '$or': [{creator: this.userId}, {owner: this.userId}],
          sessionId: {$exists: false} })
      }
    } else this.ready()
  })

  // truly public questions
  Meteor.publish('questions.public', function () {
    if (this.userId) {
      return Questions.find({ public: true })
    } else this.ready()
  })

  // questions submitted to specific course
  Meteor.publish('questions.fromStudent', function () {
    if (this.userId) {
      let cArr = _(Courses.find({ instructors: this.userId }).fetch()).pluck('_id')
      return Questions.find({
        courseId: {$in: cArr},
        sessionId: {$exists: false},
        approved: false
      })
    } else this.ready()
  })
}

/**
 * Meteor methods for questions object
 * @module questions
 */
Meteor.methods({

  /**
   * inserts a new question
   * @param {Question} question
   * @returns {Question} new question
   */
  'questions.insert' (question) {
    if (question._id) { // if _id already exists, update the question
      return Meteor.call('questions.update', question)
    }

    question.createdAt = new Date()
    question.public = false
    question.creator = Meteor.userId()

    check(question, questionPattern)

    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.hasRole(ROLES.student)) {
      // if student, can only add question to enrolled courses
      const courses = Courses.find({ _id: { $in: (user.profile.courses || []) } }).fetch()
      const courseIds = _(courses).pluck('_id')
      if (question.courseId && courseIds.indexOf(question.courseId) === -1) throw Error('Can\'t add question to this course')
    }
    check(question, questionPattern)
    const id = Questions.insert(question)
    return Questions.findOne({ _id: id })
  },

  /**
   * updates all question details
   * @param {Question} question
   * @returns {MongoID} id of updated question
   */
  'questions.update' (question) {
    check(question._id, Helpers.MongoID)
    check(question, questionPattern)

    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (!user.isInstructor(question.courseId) && (question.owner !== user._id)) throw Error('Not authorized to update question')

    const r = Questions.update({ _id: question._id }, {
      $set: _.omit(question, '_id')
    })

    if (r) return question
    else throw Error('Unable to update')
  },

  /**
   * Deletes a question by id
   * @param {MongoId} questionId
   */
  'questions.delete' (questionId) {
    check(questionId, Helpers.MongoID)

    const question = Questions.findOne({ _id: questionId })
    const userId = Meteor.userId()

    // a student deleting a public question that they copied over:
    if (question.owner === userId && question.studentCopyOfPublic) {
      return Questions.remove({ _id: questionId })
    }

    const yourCourses = _(Courses.find({ instructors: userId }).fetch()).pluck('_id')
    const ownQuestion = yourCourses.indexOf(question.courseId) > -1

    if (!ownQuestion && (question.owner !== Meteor.userId())) throw Error('Not authorized to delete question')
    if (question.creator !== question.owner) {
      // this is to not delete a student question
      question.owner = question.creator
      return Meteor.call('questions.update', question)
    }
    return Questions.remove({ _id: questionId })
  },

  /**
   * Duplicates question and attach to a session
   * @param {MongoId} sessionId
   * @param {MongoId} questionId
   */
  'questions.copyToSession' (sessionId, questionId) {
    check(sessionId, Helpers.MongoID)
    check(questionId, Helpers.MongoID)

    const session = Sessions.findOne({ _id: sessionId })
    const question = Questions.findOne({ _id: questionId })

    if (!question || !session) return

    question.originalQuestion = questionId
    question.sessionId = sessionId
    question.courseId = session.courseId
    question.owner = Meteor.userId()
    question.sessionOptions = defaultSessionOptions

    const copiedQuestion = Meteor.call('questions.insert', _(question).omit(['_id', 'createdAt', 'sessionOptions']))
    Meteor.call('sessions.addQuestion', sessionId, copiedQuestion._id)
    return copiedQuestion._id
  },

  /**
   * duplicates a public question and adds it to your library
   * @param {MongoId} questionId
   */
  'questions.copyToLibrary' (questionId) {
    check(questionId, Helpers.MongoID)

    const omittedFields = ['_id', 'originalQuestion', 'sessionId']
    // quetion below was const, but changed to let, right???
    let question = _(Questions.findOne({ _id: questionId })).omit(omittedFields)
    // Don't copy if we already own or created
    // TODO: should really check if the same question is already in the library
    // by hashing it or something similar
    //
    // this wouldn't allow a question created in a session to be copied over
    // if( (question.owner === userId || question.creator === userId) && !question.sessionId){
    //   throw new Meteor.Error('Question already in library')
    // }
    question.public = false
    question.owner = Meteor.userId()
    question.createdAt = new Date()

    // TODO: should check that the question is part of a course, and the user an instructor for that course:
    if (Meteor.user().isInstructorAnyCourse()) question.approved = true

    // this is so that the (approved) questions that students copy to their own library
    // don't show up in the instructor's libraries.
    if (!Meteor.user().isInstructorAnyCourse()) {
      question.studentCopyOfPublic = true
    }

    const id = Questions.insert(question)
    return id
  },

  // Copies a question 1000 times, used for testing
  'questions.create1000' (qId) {
    if (Meteor.userId() === 'QFy2qK88Nj32LSrwf') {
      for (var i = 0; i < 1000; i++) {
        const omittedFields = ['_id', 'originalQuestion', 'sessionId']
        const question = _(Questions.findOne({_id: qId})).omit(omittedFields)
        question.public = false
        question.owner = Meteor.userId()
        question.createdAt = new Date()
        question.approved = true
        Questions.insert(question)
      }
    } else console.log('Cannot add questions')
  },

  /**
   * returns a list of autocomplete tag sugguestions for the current user
   * if courseIdForStudent is passed, it limits tags to those from questions in that course
    * @returns {String[]} array of string tags
   */
  'questions.possibleTags' (courseIdForStudent) {
    let tags = new Set()
    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.hasGreaterRole('professor') || Courses.findOne({ instructors: this.userId })) {
      const courses = Courses.find({ instructors: Meteor.userId() }).fetch()
      courses.forEach(c => {
        tags.add(c.courseCode().toUpperCase())
      })

      const profQuestions = Questions.find({ owner: Meteor.userId() }).fetch()
      profQuestions.forEach((q) => {
        q.tags.forEach((t) => {
          tags.add(t.label.toUpperCase())
        })
      })

      let cArr = _(courses).pluck('_id')
      const questions = Questions.find({
        courseId: {$in: cArr},
        sessionId: {$exists: false},
        approved: true // false would find the tags that students created
      })

      questions.forEach((q) => {
        q.tags.forEach((t) => {
          tags.add(t.label.toUpperCase())
        })
      })
    } else { // most likely a student contributing a question:
      const coursesArray = user.profile.courses || []
      const courses = courseIdForStudent ? Courses.find({_id: courseIdForStudent}) : Courses.find({ _id: { $in: coursesArray } }).fetch()
      courses.forEach(c => {
        tags.add(c.courseCode().toUpperCase())
      })

      // tags that the student has created
      // const userQuestions = Questions.find({ owner: Meteor.userId() }).fetch()
      // userQuestions.forEach((q) => {
      //   q.tags.forEach((t) => {
      //     tags.add(t.label.toUpperCase())
      //   })
      // })

      // get tags related to the course (if specified), otherwise, tags for all courses in profile:
      const courseQuestions = courseIdForStudent
        ? Questions.find({courseId: courseIdForStudent, approved: true}).fetch()
        : Questions.find({courseId: {$in: coursesArray}, approved: true}).fetch()

      courseQuestions.forEach((q) => {
        q.tags.forEach((t) => {
          tags.add(t.label.toUpperCase())
        })
      })
    }

    return [...tags]
  },

  /**
   * adds a tag to the session tag set
   * @param {MongoId} questionId
   * @param {String} tag
   */
  'questions.addTag' (questionId, tag) {
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId) && (q.owner !== Meteor.userId())) throw Error('Not authorized to update question')

    return Questions.update({ _id: questionId }, {
      $addToSet: { tags: tag }
    })
  },

  /**
   * removes a tag from a question
   * @param {MongoId} questionId
   * @param {String} tag
   */
  'questions.removeTag' (questionId, tag) {
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId) &&
      (q.owner !== Meteor.userId()) &&
      !Meteor.user.hasGreaterRole('professor')) throw Error('Not authorized to update question')

    return Questions.update({ _id: questionId }, {
      $pull: { tags: tag }
    })
  },

  /**
   * setup default .sessionOptions for a question and add an attempt. Used to start a question during a session
   * @param {MongoId} questionId
   */
  'questions.startAttempt' (questionId) {
    if (!questionId) {
      return
    }
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId)) throw Error('Not authorized')
    if (q.sessionOptions) { // add another attempt (if first is closed)
      const maxAttempt = q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1]
      if (maxAttempt && maxAttempt.closed) {
        return Questions.update({ _id: questionId }, {
          '$push': { 'sessionOptions.attempts': { number: maxAttempt.number + 1, closed: false } }
        })
      }
    } else {
      return Questions.update({ _id: questionId }, {
        '$set': { 'sessionOptions': _.extend({}, defaultSessionOptions) }
      })
    }
  },

  /**
   * close or open the latest attempt
   * @param {MongoId} questionId
   * @param {Boolean} bool
   */
  'questions.setAttemptStatus' (questionId, bool) {
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId)) throw Error('Not authorized')

    if (q.sessionOptions) { // add another attempt (if first is closed)
      q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1].closed = bool
      return Questions.update({ _id: questionId }, {
        '$set': { 'sessionOptions.attempts': q.sessionOptions.attempts }
      })
    }
  },

  // Refactor methods below. can reduce code duplication //

  /**
   * enable stats/answer distribution visibility for students for a question
   * @param {MongoId} questionId
   */
  'questions.showStats' (questionId) {
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.stats': true }
    })
  },

  /**
   * disables stats/answer distribution visibility for students for a question
   * @param {MongoId} questionId
   */
  'questions.hideStats' (questionId) {
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.stats': false }
    })
  },

  /**
   * enables visibility of entire question in session
   */
  'questions.showQuestion' (questionId) {
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.hidden': false }
    })
  },

  /**
   * disables visibility of entire question in session
   */
  'questions.hideQuestion' (questionId) {
    if (!questionId) {
      return
    }
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.hidden': true }
    })
  },

  /**
   * enables visibility of correct answer for a question
   */
  'questions.showCorrect' (questionId) {
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.correct': true }
    })
  },

  /**
   * disables visibility of correct answer for a question
   */
  'questions.hideCorrect' (questionId) {
    check(questionId, Helpers.MongoID)
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isInstructor(q.courseId)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.correct': false }
    })
  }
}) // end Meteor.methods
