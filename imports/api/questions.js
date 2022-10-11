// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions.js: JS related to question collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { Courses } from './courses'
import { Sessions } from './sessions'

import _ from 'underscore'

import Helpers from './helpers.js'
import { ROLES, QUESTION_TYPE } from '../configs'

// expected collection pattern
const questionPattern = {
  _id: Match.Maybe(Helpers.MongoID),
  plainText: String, // plain text version of question
  type: Helpers.QuestionType,
  content: String, // wysiwyg display content
  options:  [ {
    wysiwyg:  Match.Maybe(Boolean),
    correct:  Match.Maybe(Boolean),
    answer:  Match.Maybe(Helpers.NEString),
    content:  Match.Maybe(String),
    plainText:  Match.Maybe(String),
  } ],
  toleranceNumerical: Match.Maybe(Number), // for a numerical type of question
  correctNumerical: Match.Maybe(Number), //correct answer for a numerical question
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
  //private: Match.Maybe(Boolean),
  //sharedCopy: Match.Maybe(Boolean), // Copy of question that has been shared with the user
  solution: Match.Maybe(String), // solution is the full guide to answering the question
  solution_plainText: Match.Maybe(String), // plain text version of solution
  createdAt: Date,
  approved: Boolean,
  tags: [ Match.Maybe({ value: Helpers.NEString, label: Helpers.NEString, className: Match.Maybe(String) }) ],
  // config stuff for use while running a session
  sessionOptions: Match.Maybe({
    hidden: Boolean, // temporarily hide question on screen
    stats: Boolean, // students able to see distribution of answers
    correct: Boolean, // students able to see which is correct
    points: Match.Maybe(Number), // number of points question is work
    maxAttempts: Match.Maybe(Number), // max number of attempts in a quiz setting
    attemptWeights: [Match.Maybe(Number)], // weight of each attempt
    attempts: [{
      number: Number,
      closed: Boolean
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
  maxAttempts: 1,
  attemptWeights: [1],
  attempts: [{
    number: 1,
    closed: false
  }]
}

export const defaultQuestion = {
  plainText: '',
  solution: '',
  solution_plainText: '',
  toleranceNumerical: 0,
  correctNumerical: 0,
  type: QUESTION_TYPE.SA,
  content: '',
  options: [], // { correct: false, answer: 'A', content: editor content }
  tags: [],
  //sharedCopy: false,
  public: false,
  //private: false,
  sessionOptions: defaultSessionOptions
}

//queries that correspond to different "libraries"
export const questionQueries = {
  queries:{
    library:{
      instructor: {
        sessionId: {$exists: false},
        studentCopyOfPublic: {$exists: false},
        approved: true
      },
      student: { // For student, need an additional check on the user ID of owner and creator!!!!
        sessionId: {$exists: false}
      }
    },
    public: {
      sessionId: {$exists: false},
      public: true,
      approved: true
    },
    unapprovedFromStudents : {
      sessionId: {$exists: false},
      approved: false,
      '$or': [{private: false}, {private: {$exists: false}}],
    }
  },
  options: {
    sortMostRecent: {sort:{ createdAt: -1 }},
  }
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

  /*
  Meteor.publish('questions.single', function (qId) {
    if (this.userId) {
      const user = Meteor.users.findOne({_id: this.userId})
      const question =  Questions.findOne({_id:qId})
      //const course = Courses.findOne({_id: question.courseId})
      if (user.isInstructor(question.courseId) || user.hasRole(ROLES.admin)) return Questions.find({ _id: qId})
      else if (user.isStudent(question.courseId) && (question.public || question.owner === user._id || question.creator === user._id) ) {
        return Questions.find({ _id: qId})
      }
      else return this.ready()
    } else this.ready()
  })*/

   //questions that have been used in the course
  Meteor.publish('questions.inCourse', function (courseId) {
    if (this.userId) {
      const user = Meteor.users.findOne({_id: this.userId})
      const course = Courses.findOne({_id: courseId})
      if (user.isInstructor(courseId)) return Questions.find({ sessionId: { $in: course.sessions || [] } })

      if (user.hasRole(ROLES.student)) {
        return Questions.find({ sessionId: { $in: course.sessions || [] } }, { fields: { 'options.correct': false, 'correctNumerical': false } })
      }
    } else this.ready()
  })

  // questions for reviewing a session (sends the correct flag)
  // only send to students if the reviewable flag is turned on
  Meteor.publish('questions.forReview', function (sessionId) {
    if (this.userId) {
      const user = Meteor.users.findOne({_id: this.userId})
      const session = Sessions.findOne({_id: sessionId})

      if (user.hasRole(ROLES.admin) || user.isInstructor(session.courseId)) {
        return Questions.find({ sessionId: sessionId })
      }
      if (user.hasRole(ROLES.student)) {
        if (session.reviewable) {
          return Questions.find({ sessionId: sessionId })
        } else {
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
      if (!session) return this.ready()

      if (user.isInstructor(session.courseId)) return Questions.find({ sessionId: sessionId })

      if (user.hasRole(ROLES.student)) {
        // by default fetch all Qs without correct indicator
        const initialQs = Questions.find({ sessionId: sessionId }, { fields: { 'options.correct': false, 'correctNumerical': false } }).fetch()

        initialQs.forEach(q => {
          let qToAdd = q
          // if prof has marked Q with correct visible, refetch answer options
          if (session.practiceQuiz || (q.sessionOptions && q.sessionOptions.correct) ){
            const qtemp =  Questions.findOne({_id: q._id})
            qToAdd.options = qtemp.options
            qToAdd.correctNumerical = qtemp.correctNumerical
          }
          this.added('questions', qToAdd._id, qToAdd)
        })

        this.ready()

        // need to monitor for changes on sessionOptions.correct
        // and expose options.correct based on that
        const questionsCursor = Questions.find({ sessionId: sessionId })
        const handle = questionsCursor.observeChanges({
          added: (id, fields) => {
            let newFields = fields
            const so = newFields.sessionOptions
            if (so && so.correct) { // correct should be visible
              const q = Questions.findOne({_id: id})
              newFields['options'] = q.options
              newFields['correctNumerical'] = q.correctNumerical
            } else if (so && !so.correct) { // correct should be hidden
              const q = Questions.findOne({ _id: id }, { fields: { 'options.correct': false, 'correctNumerical': false } })
              newFields['options'] = q.options
              newFields['correctNumerical'] = undefined
            }

            this.added('questions', id, newFields)
          },
          changed: (id, fields) => {
            let newFields = fields

            const so = newFields.sessionOptions
            if (so && so.correct) { // correct should be visible
              const q = Questions.findOne({_id: id})
              newFields['options'] = q.options
              newFields['correctNumerical'] = q.correctNumerical
            } else if (so && !so.correct) { // correct should be hidden
              const q = Questions.findOne({ _id: id }, { fields: { 'options.correct': false, 'correctNumerical': false } })
              newFields['options'] = q.options
              newFields['correctNumerical'] = undefined
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

  //For an instructor, the library is all approved questions for the course
  //For a student, the library is all questions in the course that they own or created
  Meteor.publish('questions.library', function (courseId) {

    if (this.userId ) {
      const course = Courses.findOne({ _id:courseId })
      if (!course) return this.ready()
      const user = Meteor.users.findOne({_id: this.userId})

      if (user.hasRole(ROLES.admin) || user.isInstructor(courseId)){
          query = _.extend(questionQueries.queries.library.instructor, {courseId: courseId})
          return Questions.find(query)
      }
      else if (user.isStudent(courseId)){
        query = _.extend(questionQueries.queries.library.student, {courseId: courseId, '$or': [{ creator: this.userId }, { owner: this.userId }] })
        return Questions.find(query)
      }
      else return this.ready()

    } else return this.ready()
  })

  Meteor.publish('questions.public', function (courseId) {

    if (this.userId) {
      const course = Courses.findOne({ _id:courseId })
      if (!course) return this.ready()
      const user = Meteor.users.findOne({_id: this.userId})

      if(user.hasRole(ROLES.admin) || user.isInstructor(courseId) || user.isStudent(courseId) ){
        query = _.extend(questionQueries.queries.public, {courseId: courseId})
        return Questions.find(query)
      } else return this.ready()

    } else return this.ready()
  })

  // questions submitted to specific course
  Meteor.publish('questions.unapprovedFromStudents', function (courseId) {
    if (this.userId) {
      const course = Courses.findOne({ _id:courseId })
      if (!course) return this.ready()
      const user = Meteor.users.findOne({_id: this.userId})
      if (!user.isInstructor(courseId) && !user.hasRole(ROLES.admin)) return this.ready()

      query = _.extend(questionQueries.queries.unapprovedFromStudents, {courseId: courseId})
      return Questions.find(query)
    } else this.ready()
  })

  Meteor.publish('questions.sharedWithUser', function (courseId) {
    if (this.userId) {
      let query = {
        sharedCopy: true,
        owner: this.userId
      }
      return Questions.find(query)
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

    const user = Meteor.users.findOne({ _id: Meteor.userId() })

    if (!user.isInstructor(question.courseId) && !user.isStudent(question.courseId)) throw new Error('Cannot insert question (user not in course)')

    if (question._id) { // if _id already exists, update the question
      return Meteor.call('questions.update', question)
    }

    question.createdAt = new Date()
    question.owner = user._id
    question.creator = user._id

    if (user.isStudent(question.courseId)){
      question.approved = false
      question.public = false
    }

    if(user.isInstructor(question.courseId)){
      question.approved = true
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
    if (!user.isInstructor(question.courseId) && (question.owner !== user._id)) throw Error('Not authorized to update question (not in course)')

    if (question.approved && user.isStudent(question.courseId)) throw Error('Not authorized to update question (student/approved)')

    //TODO: This seems weird, why not just set the question, why omit the id?
    const r = Questions.update({ _id: question._id }, {
      $set: _.omit(question, '_id')
    })

    if (r) return question
    else throw Error('Unable to update')

  },

  'questions.copy' (questionId) {
    check(questionId, Helpers.MongoID)
    let question = Questions.findOne({ _id: questionId })
    if(!question) return
    const user = Meteor.user()
    if (!user.isInstructor(question.courseId) && !user.isStudent(question.courseId)) throw new Error('Cannot copy question (user not in course)')

    question.owner = Meteor.userId()
    question.public = false
    if(user.isInstructor()){
      question.approved = true
    } else {
      question.approved = false
      question.public = false
    }
    return Meteor.call('questions.insert', _.omit(question, ['_id','sessionId']))
  },
  /**
   * Copies an existing question to a user's library
   * @param {Question} question
   * @returns {MongoID} id of updated question
   */
  /*
  'questions.duplicate' (question, userId) {
    check(question, questionPattern)
    check(userId, Helpers.MongoID)
    delete question._id
    const copiedQuestion = _.extend({ owner: userId }, _.omit(question, 'owner'))
    return Meteor.call('questions.insert', copiedQuestion)
  },*/
  /**
   * Shares a question via duplicating to a specified user's shared library
   * @param {Question} question
   * @returns {MongoID} id of updated question
   */
   /*
  'questions.share' (question, email) {
    check(question, questionPattern)

    const copiedQuestion = _.extend({ sharedCopy: true }, _.omit(question, 'sharedCopy'))

    const user = Accounts.findUserByEmail(email)// Meteor.users.findOne({ 'emails.0.address': email })
    if(!user) throw new Meteor.Error('User not found')

    return Meteor.call('questions.duplicate', copiedQuestion, user._id)
  },*/
  /**
   * Deletes a question by id
   * @param {MongoId} questionId
   */
  'questions.delete' (questionId) {
    check(questionId, Helpers.MongoID)

    let question = Questions.findOne({ _id: questionId })
    if(!question) return
    const user = Meteor.users.findOne({ _id: Meteor.userId() })

    // a student deleting a public question that they copied over:
    if (question.owner === user._id && question.studentCopyOfPublic) {
      return Questions.remove({ _id: questionId })
    }

    const isInstructor = user.isInstructor(question.courseId)

    //Can delete the question if you own it, or if you're instructor for course
    if (!isInstructor && (question.owner !== Meteor.userId())) throw Error('Not authorized to delete question')
    //Can't delete if you're not instuctor and it's approved
    if (!isInstructor && question.approved) throw Error('Not authorized to delete question')
    /*
    if (question.creator !== question.owner) {
      // this is to not delete a student question
      question.owner = question.creator
      question.approved = false
      return Meteor.call('questions.update', question)
    }*/
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
    let question = Questions.findOne({ _id: questionId })

    if (!question || !session) return

    question.originalQuestion = questionId
    question.sessionId = sessionId
    question.courseId = session.courseId
    question.owner = Meteor.userId()
    question.sessionOptions = defaultSessionOptions

    const copiedQuestion = Meteor.call('questions.insert', _(question).omit(['_id', 'createdAt']))
    Meteor.call('sessions.addQuestion', sessionId, copiedQuestion._id)
    return copiedQuestion._id
  },

  /**
   * duplicates a public question and adds it to your library
   * @param {MongoId} questionId
   */
  'questions.copyToLibrary' (questionId) {
    check(questionId, Helpers.MongoID)

    const omittedFields = ['_id', 'originalQuestion', 'sessionId', 'sessionOptions']
    // quetion below was const, but changed to let, right???
    let question = _(Questions.findOne({ _id: questionId })).omit(omittedFields)
    // Don't copy if we already own or created
    // TODO: should really check if the same question is already in the library
    // by hashing it or something similar
    //
    question.public = false
    question.owner = Meteor.userId()
    question.createdAt = new Date()

    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.isInstructor(question.courseId)) question.approved = true

    // this is so that the (approved) questions that students copy to their own library
    // don't show up in the instructor's libraries.
    if (user.isStudent(question.courseId)) {
      question.studentCopyOfPublic = true //TODO: probably do not need this property anymore, if we set approved to false
      question.approved = false
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
  'questions.possibleTags' (courseId) {
    let tags = new Set
    const questions = Questions.find({
      courseId: courseId,
      //sessionId: {$exists: false},
      approved: true // false would find the tags that students created (if they were allowed)
    })
    questions.forEach((q) => {
      q.tags.forEach((t) => {
        tags.add(t.label.toUpperCase())
      })
    })
    return [...tags]
    /*
    /// OLD

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

    return [...tags]*/
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
    if (!q) return

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
