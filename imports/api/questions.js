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
  _id: Match.Maybe(Helpers.MongoID)
}

// Create Question class
const Question = function (doc) { _.extend(this, doc) }
_.extend(Question.prototype, {

})

// Create question collection
export const Questions = new Mongo.Collection('questions',
  { transform: (doc) => { return new Question(doc) } }
)




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

  }

}) // end Meteor.methods
