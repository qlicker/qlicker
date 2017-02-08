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
const questionPattern = {
  _id: Match.Maybe(Helpers.MongoID),
  question: Helpers.NEString, // plain text version of question
  content: Object, // drafts.js display content
  answers: [ { answer: String, content: Match.Maybe(Object) } ], // List of multi choice { display: "A", content: editor content }
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


var imageStore = new FS.Store.GridFS('images');

export const QuestionImages = new FS.Collection('images', {
 stores: [imageStore]
});
// Images publishing
if (Meteor.isServer) {
  Meteor.publish('images', function(){ return QuestionImages.find() })
}
QuestionImages.deny({
  insert: function() { return false },
  update: function() { return false },
  remove: function() { return false },
  download: function() { return false }
});
QuestionImages.allow({
  insert: function() { return true },
  update: function() { return true },
  remove: function() { return true },
  download: function() { return true }
});

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
    question.question = 'Plain text representation of content'
    question.submittedBy = this.userId
    check(question, questionPattern)
    return Questions.insert(question)
  }

}) // end Meteor.methods
