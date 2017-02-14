/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// sessions.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { Courses, profHasCoursePermission } from './courses'

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
    content: Match.Maybe(Helpers.NEString)
  } ],
  submittedBy: Helpers.MongoID,
  courseId: Helpers.MongoID,
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
    if (question._id) {
      return Meteor.call('questions.update', question)
    }

    question.createdAt = new Date()
    question.public = false
    question.submittedBy = Meteor.userId()

    let courseIds
    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.hasGreaterRole('professor')) {
      const courses = Courses.find({ owner: Meteor.userId() }).fetch()
      courseIds = _(courses).pluck('_id')
    } else {
      const coursesArray = user.profile.courses || []
      const courses = Courses.find({ _id: { $in: coursesArray } }).fetch()
      courseIds = _(courses).pluck('_id')
    }
    if (courseIds.indexOf(question.courseId) === -1) throw Error('Can\'t add this this course')

    check(question, questionPattern)
    return Questions.insert(question)
  },

  'questions.update' (question) {
    check(question._id, Helpers.MongoID)
    check(question, questionPattern)

    return Questions.update({ _id: question._id }, {
      $set: _.omit(question, '_id')
    })
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
    profHasCoursePermission(q.courseId)

    return Questions.update({ _id: questionId }, {
      $addToSet: { tags: tag }
    })
  },

  'questions.removeTag' (questionId, tag) {
    const q = Questions.findOne({ _id: questionId })
    profHasCoursePermission(q.courseId)

    return Questions.update({ _id: questionId }, {
      $pull: { tags: tag }
    })
  }

}) // end Meteor.methods
