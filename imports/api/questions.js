/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// sessions.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import Helpers from './helpers.js'

// expected collection pattern
const questionPattern = {
  _id: Match.Maybe(Helpers.MongoID),
  question: Helpers.NEString, // plain text version of question
  content: Helpers.NEString, // drafts.js display content
  answers: [ { answer: Helpers.NEString, content: Helpers.NEString } ], // List of multi choice { display: "A", content: editor content }
  submittedBy: Helpers.MongoID,
  createdAt: Date,
  tags: [ Match.Maybe(Helpers.NEString) ]
}

// Create Question class
const Question = function (doc) { _.extend(this, doc) }
_.extend(Question.prototype, {

})

// Create question collection
export const Questions = new Mongo.Collection('questions',
  { transform: (doc) => { return new Question(doc) } }
)


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
    question.createdAt = new Date()
    question.submittedBy = Meteor.userId()
    check(question, questionPattern)
    return Questions.insert(question)
  }

}) // end Meteor.methods
