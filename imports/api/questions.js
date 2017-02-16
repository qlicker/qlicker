/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// sessions.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { Courses, profHasCoursePermission } from './courses'
import { Sessions } from './sessions'

import { _ } from 'underscore'

import Helpers from './helpers.js'

// expected collection pattern
const questionPattern = {
  _id: Match.Maybe(Helpers.MongoID),
  question: Helpers.NEString, // plain text version of question
  type: Helpers.QuestionType,
  content: Helpers.NEString, // drafts.js display content
  answers: [ {
    wysiwyg: Boolean,
    correct: Boolean,
    answer: Helpers.NEString,
    content: Match.Maybe(Helpers.NEString),
    plainText: Helpers.NEString
  } ],
  submittedBy: Helpers.MongoID,
  // null if template, questionId of original once copied to question
  originalQuestion: Match.Maybe(Helpers.MongoID),
  // null if question template, sessionId if copy attached to question
  sessionId: Match.Maybe(Helpers.MongoID),
  // null if prof created, populated for students creating question for enrolled course
  courseId: Match.Maybe(Helpers.MongoID),
  // student submitted questions are always public, prof can mark question templates as public
  public: Boolean,
  createdAt: Date,
  tags: [ Match.Maybe({ id: Number, text: Helpers.NEString }) ]
}

// Create Question class
const Question = function (doc) { _.extend(this, doc) }
_.extend(Question.prototype, {})

// Create question collection
export const Questions = new Mongo.Collection('questions',
  { transform: (doc) => { return new Question(doc) } })

var imageStore = new FS.Store.GridFS('images')

export const QuestionImages = new FS.Collection('images', {
  stores: [imageStore]
})
// Images publishing
if (Meteor.isServer) {
  Meteor.publish('images', function () { return QuestionImages.find() })
}
QuestionImages.deny({ insert: () => false, update: () => false, remove: () => false, download: () => false })
QuestionImages.allow({ insert: () => true, update: () => true, remove: () => true, download: () => true })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('questions', function () {
    if (this.userId) {
      return Questions.find({})
    } else this.ready()
  })
}

// data methods
Meteor.methods({

  'questions.insert' (question) {
    if (question._id) { // if _id already exists, update the question
      return Meteor.call('questions.update', question)
    }

    question.createdAt = new Date()
    question.public = false
    question.submittedBy = Meteor.userId()

    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.hasRole('student')) {
      question.public = true

      // if student, can only add question to enrolled courses
      const courses = Courses.find({ _id: { $in: (user.profile.courses || []) } }).fetch()
      const courseIds = _(courses).pluck('_id')
      if (courseIds.indexOf(question.courseId) === -1) throw Error('Can\'t add question to this course')
    }

    check(question, questionPattern)
    return Questions.insert(question)
  },

  'questions.update' (question) {
    check(question._id, Helpers.MongoID)
    check(question, questionPattern)

    if (question.submittedBy !== Meteor.userId()) throw Error('Not authorized to update question')

    return Questions.update({ _id: question._id }, {
      $set: _.omit(question, '_id')
    })
  },

  'question.copyToSession' (questionId, sessionId) {
    const session = Sessions.findOne({ _id: sessionId })
    const question = Questions.findOne({ _id: questionId })

    question.originalQuestion = questionId
    question.sessionId = sessionId
    question.courseId = session.courseId

    const copiedQuestionId = Meteor.call('questions.insert', _(question).omit(['_id', 'createdAt']))
    Meteor.call('sessions.addQuestion', sessionId, copiedQuestionId)
    return copiedQuestionId
  },

  'questions.possibleTags' () {
    let tags = []

    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.hasGreaterRole('professor')) {
      const courses = Courses.find({ owner: Meteor.userId() }).fetch()
      courses.forEach(c => {
        tags.push(c.courseCode().toUpperCase())
      })
    } else {
      const coursesArray = user.profile.courses || []
      const courses = Courses.find({ _id: { $in: coursesArray } }).fetch()
      courses.forEach(c => {
        tags.push(c.courseCode().toUpperCase())
      })
    }

    return tags
  },

  'questions.addTag' (questionId, tag) {
    const q = Questions.findOne({ _id: questionId })
    if (q.submittedBy !== Meteor.userId()) throw Error('Not authorized to update question')

    return Questions.update({ _id: questionId }, {
      $addToSet: { tags: tag }
    })
  },

  'questions.removeTag' (questionId, tag) {
    const q = Questions.findOne({ _id: questionId })
    if (q.submittedBy !== Meteor.userId()) throw Error('Not authorized to update question')

    return Questions.update({ _id: questionId }, {
      $pull: { tags: tag }
    })
  }

}) // end Meteor.methods
