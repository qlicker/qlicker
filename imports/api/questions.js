/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions.js: JS related to question collection

import Busboy from 'busboy'

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
  tags: [ Match.Maybe({ value: Helpers.NEString, label: Helpers.NEString, className: Match.Maybe(String) }) ],
  // config stuff for use while running a session
  sessionOptions: Match.Maybe({
    hidden: Boolean, // temporarily hide question on screen
    stats: Boolean, // students able to see distribution of answers
    correct: Boolean, // students able to see which is correct
    attempts: [{
      number: Number,
      closed: Boolean
    }]
  }),
  imagePath: Match.Maybe(String)
}

const defaultSessionOptions = {
  hidden: false,
  stats: false,
  correct: false,
  attempts: [{
    number: 1,
    closed: false
  }]
}

// Create Question class
const Question = function (doc) { _.extend(this, doc) }
_.extend(Question.prototype, {
})

// Create question collection
export const Questions = new Mongo.Collection('questions',
  { transform: (doc) => { return new Question(doc) } })

/* var imageStore = new FS.Store.GridFS('images')

export const QuestionImages = new FS.Collection('images', {
  stores: [imageStore],
  filter: {
    allow: {
      contentTypes: ['image/*']
    }
  }
})
// Images publishing
if (Meteor.isServer) {
  Meteor.publish('images', function () { return QuestionImages.find() })
}
QuestionImages.deny({ insert: () => false, update: () => false, remove: () => false, download: () => false })
QuestionImages.allow({ insert: () => true, update: () => true, remove: () => true, download: () => true }) */
/*
// Post route for accepting image uploads (for ckeditor)
if (Meteor.isserver) Router.use(Router.bodyParser())
Router.route('/upload/images', { where: 'server',
  onBeforeAction: function (req, res, next) {
    // ref https://github.com/iron-meteor/iron-router/issues/909
    var files = [] // Store files in an array and then pass them to request.
    var image = {} // crate an image object

    if (req.method === 'POST') {
      var busboy = new Busboy({ headers: req.headers })
      busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        image.mimeType = mimetype
        image.encoding = encoding

        var buffers = []
        file.on('data', function (data) {
          buffers.push(data)
        })
        file.on('end', function () {
          image.data = Buffer.concat(buffers)
          files.push(image)
        })
      })
      busboy.on('field', function (fieldname, value) {
        req.body[fieldname] = value
      })
      busboy.on('finish', function () {
        req.files = files
        next()
      })
      req.pipe(busboy)
    } else this.next()
  }
})
.post(function (req, res, next) {
  // ref https://github.com/CollectionFS/Meteor-CollectionFS/issues/246
  var imageBuffer = new Buffer(req.files[0]['data'], 'base64')
  var newFile = new FS.File()
  newFile.attachData(imageBuffer, {type: 'image/png'}, function (error) {
    if (error) throw error
    newFile.name(req.files[0]['dataId'] + '.png')
    QuestionImages.insert(newFile, (err, fileObj) => {
      if (err) res.end('Error uploading image')
      else {
        const response = {
          uploaded: 1,
          fileName: '/cfs/files/images/' + fileObj._id,
          url: '/cfs/files/images/' + fileObj._id
        }
        setTimeout(() => { // wait for cfs to make image available
          res.end(JSON.stringify(response))
        }, 500)
      }
    })
  })
}) */

// data publishing
if (Meteor.isServer) {
  Meteor.publish('questions.inCourse', function (courseId) {
    if (this.userId) {
      const user = Meteor.users.findOne(this.userId)
      const course = Courses.findOne(courseId)
      if (user.hasRole(ROLES.prof)) return Questions.find({ sessionId: { $in: course.sessions || [] } })

      if (user.hasRole(ROLES.student)) {
        return Questions.find({ sessionId: { $in: course.sessions || [] } }, { fields: { 'options.correct': false } })
      }
    } else this.ready()
  })

  Meteor.publish('questions.forReview', function (sessionId) {
    if (this.userId) {
      return Questions.find({ sessionId: sessionId })
    } else this.ready()
  })

  // questions in a specific question
  Meteor.publish('questions.inSession', function (sessionId) {
    if (this.userId) {
      const user = Meteor.users.findOne(this.userId)
      const course = Courses.findOne({'sessions': sessionId})
      if (user.hasRole(ROLES.prof) || user.isTA(course._id)) return Questions.find({ sessionId: sessionId })

      if (user.hasRole(ROLES.student)) {
        // by default fetch all Qs without correct indicator
        const initialQs = Questions.find({ sessionId: sessionId }, { fields: { 'options.correct': false } }).fetch()

        initialQs.forEach(q => {
          const qToAdd = q
          // if prof has marked Q with correct visible, refetch answer options
          if (q.sessionOptions && q.sessionOptions.correct) qToAdd.options = Questions.findOne(q._id).options
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
              const q = Questions.findOne(id)
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

  // questions owned by a professor
  Meteor.publish('questions.library', function () {
    if (this.userId) {
      const user = Meteor.users.findOne(this.userId)
      if (!user.hasRole(ROLES.prof)) return this.ready()

      return Questions.find({ submittedBy: this.userId, sessionId: {$exists: false} })
    } else this.ready()
  })

  // truly public questions
  Meteor.publish('questions.public', function () {
    if (this.userId) {
      return Questions.find({ public: true, courseId: {$exists: false} })
    } else this.ready()
  })

  // questions submitted to specific course
  Meteor.publish('questions.fromStudent', function () {
    if (this.userId) {
      const user = Meteor.users.findOne(this.userId)
      let cArr = user.profile.TA || []
      cArr = cArr.concat(_(Courses.find({ owner: this.userId }).fetch()).pluck('_id'))
      return Questions.find({
        courseId: {$in: cArr},
        sessionId: {$exists: false},
        public: true
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
    question.submittedBy = Meteor.userId()

    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.hasRole(ROLES.student)) {
      question.public = true

      // if student, can only add question to enrolled courses
      const courses = Courses.find({ _id: { $in: (user.profile.courses || []) } }).fetch()
      const courseIds = _(courses).pluck('_id')
      if (courseIds.indexOf(question.courseId) === -1) throw Error('Can\'t add question to this course')
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
    if (question.submittedBy !== Meteor.userId() && !user.hasGreaterRole('professor') && !user.isTA(question.courseId)) throw Error('Not authorized to update question')

    const r = Questions.update({ _id: question._id }, {
      $set: _.omit(question, '_id')
    })

    if (r) return question._id
    else throw Error('Unable to update')
  },

  /**
   * Deletes a question by id
   * @param {MongoId} questionId
   */
  'questions.delete' (questionId) {
    check(questionId, Helpers.MongoID)

    const question = Questions.findOne({ _id: questionId })
    let yourCourses = _(Courses.find({ owner: Meteor.userId() }).fetch()).pluck('_id')
    const TACourses = Meteor.users.findOne({ _id: Meteor.userId() }).profile.TA

    yourCourses = yourCourses.concat(TACourses)

    const ownQuestion = question.submittedBy === Meteor.userId()
    const fromYourStudent = question.courseId && yourCourses.indexOf(question.courseId) > -1
    if (!ownQuestion && !fromYourStudent) throw Error('Not authorized to delete question')

    return Questions.remove({ _id: questionId })
  },

  /**
   * Duplicates question and attach to a session
   * @param {MongoId} sessionId
   * @param {MongoId} questionId
   */
  'questions.copyToSession' (sessionId, questionId) {
    const session = Sessions.findOne({ _id: sessionId })
    const question = Questions.findOne({ _id: questionId })

    question.originalQuestion = questionId
    question.sessionId = sessionId
    question.courseId = session.courseId

    const copiedQuestion = Meteor.call('questions.insert', _(question).omit(['_id', 'createdAt']))
    Meteor.call('sessions.addQuestion', sessionId, copiedQuestion._id)
    return copiedQuestion._id
  },

  /**
   * duplicates a public question and adds it to your library
   * @param {MongoId} questionId
   */
  'questions.copyToLibrary' (questionId) {
    const omittedFields = ['_id', 'originalQuestion', 'courseId', 'sessionId']
    const question = _(Questions.findOne({ _id: questionId })).omit(omittedFields)
    question.public = false
    question.submittedBy = Meteor.userId()
    question.createdAt = new Date()

    const id = Questions.insert(question)
    return id
  },

  /**
   * duplicates a public question and adds it to your library
   * @param {MongoId} questionId
   * * @param {MongoId} courseId
   */
  'questions.copyToCourse' (questionId, courseId) {
    const course = Courses.find(courseId).fetch()[0]
    const omittedFields = ['_id', 'originalQuestion', 'courseId', 'sessionId']
    const question = _(Questions.findOne({ _id: questionId })).omit(omittedFields)
    question.public = false
    question.submittedBy = course.owner
    question.createdAt = new Date()

    const id = Questions.insert(question)
    return id
  },

  /**
   * returns a list of autocomplete tag sugguestions for the current user
    * @returns {String[]} array of string tags
   */
  'questions.possibleTags' () {
    let tags = new Set()
    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.hasGreaterRole('professor')) {
      const courses = Courses.find({ owner: Meteor.userId() }).fetch()
      courses.forEach(c => {
        tags.add(c.courseCode().toUpperCase())
      })

      const profQuestions = Questions.find({ submittedBy: Meteor.userId() }).fetch()
      profQuestions.forEach((q) => {
        q.tags.forEach((t) => {
          tags.add(t.label.toUpperCase())
        })
      })
    } else {
      const coursesArray = user.profile.courses || []
      const courses = Courses.find({ _id: { $in: coursesArray } }).fetch()
      courses.forEach(c => {
        tags.add(c.courseCode().toUpperCase())
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
    const q = Questions.findOne({ _id: questionId })
    if (q.submittedBy !== Meteor.userId() && !Meteor.user().isTA(q.courseId)) throw Error('Not authorized to update question')

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
    const q = Questions.findOne({ _id: questionId })
    if (q.submittedBy !== Meteor.userId() && !Meteor.user().isTA(q.courseId)) throw Error('Not authorized to update question')

    return Questions.update({ _id: questionId }, {
      $pull: { tags: tag }
    })
  },

  /**
   * setup default .sessionOptions for a question and add an attempt. Used to start a question during a session
   * @param {MongoId} questionId
   */
  'questions.startAttempt' (questionId) {
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().hasRole(ROLES.prof) && !Meteor.user().isTA(q.courseId)) throw Error('Not authorized')

    if (q.sessionOptions) { // add another attempt (if first is closed)
      const maxAttempt = q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1]
      if (maxAttempt.closed) {
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
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isTA(q.courseId) && !Meteor.user().hasRole(ROLES.prof)) throw Error('Not authorized')

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
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isTA(q.courseId) && !Meteor.user().hasRole(ROLES.prof)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.stats': true }
    })
  },

  /**
   * disables stats/answer distribution visibility for students for a question
   * @param {MongoId} questionId
   */
  'questions.hideStats' (questionId) {
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isTA(q.courseId) && !Meteor.user().hasRole(ROLES.prof)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.stats': false }
    })
  },

  /**
   * enables visibility of entire question in session
   */
  'questions.showQuestion' (questionId) {
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isTA(q.courseId) && !Meteor.user().hasRole(ROLES.prof)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.hidden': false }
    })
  },

  /**
   * disables visibility of entire question in session
   */
  'questions.hideQuestion' (questionId) {
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isTA(q.courseId) && !Meteor.user().hasRole(ROLES.prof)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.hidden': true }
    })
  },

  /**
   * enables visibility of correct answer for a question
   */
  'questions.showCorrect' (questionId) {
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isTA(q.courseId) && !Meteor.user().hasRole(ROLES.prof)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.correct': true }
    })
  },

  /**
   * disables visibility of correct answer for a question
   */
  'questions.hideCorrect' (questionId) {
    const q = Questions.findOne({ _id: questionId })
    if (!Meteor.user().isTA(q.courseId) && !Meteor.user().hasRole(ROLES.prof)) throw Error('Not authorized')

    return Questions.update({ _id: questionId }, {
      '$set': { 'sessionOptions.correct': false }
    })
  }

}) // end Meteor.methods
