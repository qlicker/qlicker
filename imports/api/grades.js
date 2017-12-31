// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// grades.js: JS related to grade collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import Helpers from './helpers.js'
import { Sessions } from './sessions.js'
import { Courses } from './courses.js'
import { Questions } from './questions.js'
import { Responses } from './responses.js'

import { Stats } from '../stats.js'

import { ROLES, QUESTION_TYPE, isAutoGradeable } from '../configs'

// expected collection pattern
const gradePattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  userId: Helpers.NEString, // Id of user whose grade this is
  courseId: Match.Maybe(Helpers.NEString), // course Id of the grade
  sessionId: Match.Maybe(Helpers.NEString), // session Id of the grade
  name: Match.Maybe(String),// name of grade (defaults to session name)
  marks: Match.Maybe([ { // a set of marks that result in the grade
    questionId: Match.Maybe(Helpers.NEString), //Id of question
    responseId: Match.Maybe(Helpers.NEString), //Id of response used to calculate points
    attempt: Match.Maybe(Number), //attempt for that question
    points: Match.Maybe(Number), // value of the mark for that question
    outOf: Match.Maybe(Number), // value of the mark for that question
    automatic: Match.Maybe(Boolean), // whehter the value was automatically calculated (and should be automatically updated)
    needsGrading:  Match.Maybe(Boolean), // whether the points need to be set manually (for a non-autogradeable question)
  } ]),
  joined: Match.Maybe(Boolean), //whether user had joined the session for this grade
  participation: Match.Maybe(Number), // fraction of questions worth points that were answered
  value: Match.Maybe(Number), // calculated value of grade, can be manually overridden
  automatic: Match.Maybe(Boolean), // whether the grade was set automatically or manually overidden
  points: Match.Maybe(Number), // number of points obtained, always calculated automatically
  outOf: Match.Maybe(Number),// total number of points available
  numAnswered: Match.Maybe(Number), // number of questions worth points answered
  numQuestions: Match.Maybe(Number), // number of questions worth points
  numAnsweredTotal: Match.Maybe(Number), // total number of questions answered
  numQuestionsTotal: Match.Maybe(Number), // total number of questions \
  visibleToStudents: Match.Maybe(Boolean)// whether grade is visible to students (non-instructors)
}

// Create grade class
export const Grade = function (doc) { _.extend(this, doc) }
_.extend(Grade.prototype, {
  // Determine if a grade has questions that need to be graded manually that haven't been graded
  // (mark is set to automatic and of a type that is not autogradeable, and person responded)
  hasUngradedMarks: function () {
    let needsGrading = false
    if (!this.joined || this.numAnswered === 0) return false
    this.marks.forEach( (m) => {
      if (m.needsGrading) needsGrading = true
      /*
      if (!m.automatic) return // has already been manually graded, so continue
      let question = Questions.findOne({ _id:m.questionId })
      if (question && !isAutoGradeable(question.type) && m.automatic &&
         question.sessionOptions && ('points' in question.sessionOptions) &&
         question.sessionOptions.points > 0 && m.responseId !== "0") {
         needsGrading = true
      }
      */
    })
    return needsGrading
  },
  hasManualMarks: function () {
    let manual = false
    if (!this.automatic) return true
    if (!this.joined || this.numAnswered === 0) return false
    this.marks.forEach( (m) => {
      if (!m.automatic) manual = true
    })
    return manual
  },

})
// Create grade collection
export const Grades = new Mongo.Collection('grades',
  { transform: (doc) => { return new Grade(doc) } })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('grades.all', function () {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin)) {
        return Grades.find()
      } else if (user.isInstructorAnyCourse()) {
        const courses = user.coursesInstructed()
        return Grades.find({ courseId: { $in: courses || [] } }) // finds all the course owned
      } else {
        return Grades.find({ userId: this.userId, visibleToStudents: true } )
      }
    } else this.ready()
  })

  Meteor.publish('grades.single', function (gradeId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin)) {
        return Grades.find({ _id:gradeId })
      } else if (user.isInstructorAnyCourse()) {
        const courses = user.coursesInstructed()
        return Grades.find({ _id:gradeId, courseId: { $in: courses || [] } }) // finds all the course owned
      } else {
        return Grades.find({ _id:gradeId, userId: this.userId, visibleToStudents: true } )
      }
    } else this.ready()
  })

  Meteor.publish('grades.forCourse', function (courseId) {
    check(courseId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin) || user.isInstructor(courseId)) {
        return Grades.find({ courseId: courseId}) // finds all the course owned
      } else {
        return Grades.find({ userId: this.userId, courseId: courseId, visibleToStudents: true } )
      }
    } else this.ready()
  })

  Meteor.publish('grades.forSession', function (sessionId) {
    check(sessionId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const sess = Sessions.findOne({ _id: sessionId})
      const courseId = sess ? sess.courseId: ''

      if (user.hasGreaterRole(ROLES.admin) || user.isInstructor(courseId)) {
        return Grades.find({ sessionId: sessionId}) // finds all the course owned
      } else {
        return Grades.find({ userId: this.userId, sessionId: sessionId, visibleToStudents: true } )
      }
    } else this.ready()
  })

  Meteor.publish('grades.forQuestion', function (questionId) {
    check(questionId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const q = Questions.findOne({ _id: questionId})
      const sessionId = q.sessionId ? q.sessionId : ''
      const sess = Sessions.findOne({ _id: sessionId})
      const courseId = sess ? sess.courseId: ''

      if (user.hasGreaterRole(ROLES.admin) || user.isInstructor(courseId)) {
        return Grades.find({ questionId: questionId}) // finds all the course owned
      } else {
        return Grades.find({ userId: this.userId, questionId: questionId, visibleToStudents: true } )
      }
    } else this.ready()
  })
}

/**
 * Calculates the number of points for a response
 * @param {Response} response - response object
 */
export const calculateResponsePoints = (response) => {
  if (!response) return 0
  // if (!response || !response.attempt) return 0
  const q = Questions.findOne({ _id: response.questionId })
  const answer = response.answer
  if (!q || !answer) return 0

  if (!isAutoGradeable(q.type)) return 0

  const correct = _.map(_.filter(q.options, {correct: true}), (op) => op.answer) // correct responses
  const attemptNumber = response.attempt
  let points = 1.0 // points that the question is worth

  let weight = 1.0 // weight of that attempt of the question (e.g. second attempt could be worth less points)
  if(q.sessionOptions){
    if('points' in q.sessionOptions){
      points = q.sessionOptions.points
    }
    if(q.sessionOptions.maxAttempts && q.sessionOptions.attemptWeights){
      if(attemptNumber < q.sessionOptions.maxAttempts + 1 && attemptNumber < q.sessionOptions.attemptWeights.length + 1){
        weight =  q.sessionOptions.attemptWeights[attemptNumber - 1]
      } else {
        weight = 0
      }
    }
  }
  points *= weight
  // No point in grading it if the question is not worth any points!
  if (points === 0) return 0

  let mark = 0 // between 0 and 1 depending on the answer
  switch (q.type) {
    case QUESTION_TYPE.MC:
      mark = correct[0] === answer ? 1 : 0
      break
    case QUESTION_TYPE.TF:
      mark = correct[0] === answer ? 1 : 0
      break
    case QUESTION_TYPE.MS: // (correct responses-incorrect responses)/(correct answers)
      const intersection = _.intersection(correct, answer)
      const percentage = (2 * intersection.length - answer.length) / correct.length
      mark = percentage > 0 ? percentage : 0
      break
  }
  return mark*points
 }

/**
 * Meteor methods for grades object
 * @module grades
 */
Meteor.methods({
  /**
   * insert new course object into Courses mongodb Collection
   * @param {Grade} grade - grade object without id
   * @returns {MongoId} id of new grade
   */
  'grades.insert' (grade) {
    check(grade, gradePattern)
    if(grade && grade._id){
      return Meteor.call('grades.update', grade)
    }
    const user = Meteor.user()

    if ( !user.hasRole(ROLES.admin) &&
         !user.isInstructor(grade.courseId) ) {
      throw new Meteor.Error('not-authorized')
    }

    const g = Grades.insert(grade, (e, id) => {
      if (e) alertify.error('Error inserting grade')
    })
    return g
  },

  /**
   * Updates a grade item
   * @param {Grade} grade - grade object with id
   */
  'grades.update' (grade) {
    check(grade, gradePattern)

    const user = Meteor.user()

    if ( !user.hasRole(ROLES.admin) &&
         !user.isInstructor(grade.courseId)  ) {
      throw new Meteor.Error('not-authorized')
    }

    if (!grade){
      throw Error('Undefined grade in update!')
    }
    const r = Grades.update({ _id: grade._id }, {
      $set: _.omit(grade, '_id')
    })

    if (r) return grade
    else throw Error('Unable to update')
  },

  /**
   * Hide the grades from the students
   * @param {MongoID} sessionId - session ID
   */
  'grades.hideFromStudents' (sessionId) {
    const r = Grades.update({ sessionId: sessionId}, {
      $set: { visibleToStudents:false }
    })
  },
  /**
   * Show the grades to the students
   * @param {MongoID} sessionId - session ID
   */
  'grades.showToStudents' (sessionId) {
    const r = Grades.update({ sessionId: sessionId}, {
      $set: { visibleToStudents:true }
    })
  },
  /**
   * Update points for an existing grade
   * @param {MongoId} grade - grade object with id
   */
  'grades.updatePoints' (grade) {
    if (Meteor.isServer){
      check(grade, gradePattern)

      const marks = grade.marks
      let gradePoints = 0
      for (let i = 0; i < marks.length; i++){
        gradePoints += marks[i].points
      }

      let gradeValue = 0
      if(gradePoints > 0) {
        if(grade.outOf > 0){
          gradeValue = (100 * gradePoints/grade.outOf)
        }else{
          gradeValue = 100
        }
      }
      grade.points = gradePoints
      if( grade.automatic ){
        grade.value = gradeValue
      }
      Meteor.call('grades.update', grade)
    }
  },

  'grades.setMarkAutomatic' (gradeId, questionId) {
    if (Meteor.isServer){
      check(gradeId, Helpers.MongoID)
      check(questionId, Helpers.MongoID)

      let grade = Grades.findOne({ _id:gradeId })
      if (!grade){
        throw Error('No grade with this id')
      }
      const user = Meteor.user()

      if ( !user.hasRole(ROLES.admin) &&
           !user.isInstructor(grade.courseId)  ) {
        throw new Meteor.Error('not-authorized')
      }

      const question = Questions.findOne({ _id: questionId })
      if (!isAutoGradeable(question.type)) {
        throw new Meteor.Error('Question type cannot be graded automatically')
      }

      let marks = grade.marks
      let mark = _(marks).findWhere({ questionId:questionId })

      if (mark){
        const response = Responses.findOne({ _id: mark.responseId})
        mark.points = calculateResponsePoints(response)
        mark.automatic = true
        Meteor.call('grades.updatePoints', grade)

      } else {
        throw Error('questionId not in grade item')
      }
    }
  },

  'grades.setGradeAutomatic' (gradeId) {
    if (Meteor.isServer){
      check(gradeId, Helpers.MongoID)

      let grade = Grades.findOne({ _id:gradeId })
      if (!grade){
        throw Error('No grade with this id')
      }
      const user = Meteor.user()

      if ( !user.hasRole(ROLES.admin) &&
           !user.isInstructor(grade.courseId)  ) {
        throw new Meteor.Error('not-authorized')
      }

      grade.automatic = true
      Meteor.call('grades.updatePoints', grade)
    }
  },
  /**
   * Set the grade value directly
   * @param {MongoId} gradeId - grade object with id
   * @param {Number} value- new value for the grade
   */
  'grades.setGradeValue' (gradeId, value) {
    if (Meteor.isServer){
      check(gradeId, Helpers.MongoID)
      check(value, Number)

      let grade = Grades.findOne({ _id:gradeId })
      if (!grade){
        throw Error('No grade with this id')
      }

      const user = Meteor.user()

      if ( !user.hasRole(ROLES.admin) &&
           !user.isInstructor(grade.courseId)  ) {
        throw new Meteor.Error('not-authorized')
      }

      grade.value = value
      grade.automatic = false
      Meteor.call('grades.updatePoints', grade)
    }
  },

  /**
   * Set points for a mark in a grade item and recalulate grade point sum
   * @param {MongoId} gradeId - grade object with id
   * @param {MongoId} questionId - the id of the question for which to set the mark points
   * @param {Number} points- new value of the points for that grade
   */
  'grades.setMarkPoints' (gradeId, questionId, points) {
    if (Meteor.isServer){
      check(gradeId, Helpers.MongoID)
      check(questionId, Helpers.MongoID)
      check(points, Number)

      let grade = Grades.findOne({ _id:gradeId })
      if (!grade){
        throw Error('No grade with this id')
      }

      const user = Meteor.user()

      if ( !user.hasRole(ROLES.admin) &&
           !user.isInstructor(grade.courseId)  ) {
        throw new Meteor.Error('not-authorized')
      }

      let marks = grade.marks
      let mark = _(marks).findWhere({ questionId:questionId })

      if (mark){
        mark.points = points
        mark.automatic = false
        mark.needsGrading = false
        Meteor.call('grades.updatePoints', grade)
      } else {
        throw Error('questionId not in grade item')
      }
    }
  },

  /**
   * Calculate all grades for a session
   * @param {MongoID} sessionId - session ID
   */
  'grades.calcSessionGrades' (sessionId){
    if (Meteor.isServer){ // only run this on the server!
      const user = Meteor.user()
      const sess = Sessions.findOne({ _id: sessionId})
      if (!sess) {
        throw Error('No session with this id')
      }
      const courseId = sess ? sess.courseId: ''
      const course = Courses.findOne({ _id: courseId})

      if (!user.hasGreaterRole(ROLES.admin) && !user.isInstructor(courseId)) {
        throw Error('Unauthorized to grade session')
      }

      // questions in the session
      const qIds = sess ? sess.questions : []
      // responses corresponding to questions in the session
      const responses = Responses.find({ questionId: { $in: qIds}}).fetch()
      // questions in the session (sort to be in the same order)
      let questionsUnsorted = Questions.find({ _id: { $in: qIds}}).fetch()
      let questions = []
      qIds.forEach( (qId) => {
        questions.push( _(questionsUnsorted).findWhere({ _id:qId}) )
      })

      //the total number of questions in the session (that have responses)
      const numQuestionsTotal = questions.length

      //count the questions that are worth points, keep track of total marks for each question
      let numQuestions = 0 // worth points
      let markOutOf = []
      let gradeOutOf = 0
      for(let iq = 0; iq < numQuestionsTotal; iq++){
        let question  = questions[iq]
        // assume that it is worth 1 point
        markOutOf.push(1)

        // TODO: Check this still makes sense
        // Assume that short answer is not worth any points if the points were not set
        // This is to deal with backwards compatibility for questions that were in the DB
        // before points were assigned and SA were counted in participation if any answer was entered
        if(question.type === QUESTION_TYPE.SA){
           markOutOf[iq] = 0
        }
        // except if the number of points was assigned to the SA (or other question)
        if (question.sessionOptions && ('points' in question.sessionOptions) ){
           markOutOf[iq] = question.sessionOptions.points
        }
        if(markOutOf[iq] > 0){
          numQuestions +=1
        }
        gradeOutOf += markOutOf[iq]
      }

      const studentIds = course.students ? course.students : []
      const stats = new Stats(questions, responses)

      const defaultGrade = {
        courseId: courseId,
        sessionId: sessionId,
        name: sess.name,
        joined: false,
        participation: 0,
        value: 0,
        points: 0,
        automatic: true,
        outOf: 0,
        numAnswered: 0,
        numQuestions: 0,
        visibleToStudents: sess.reviewable,
        marks: []
      }

      for(let is = 0; is < studentIds.length; is++){
        const studentId = studentIds[is]
        let existingGrade = Grades.findOne({ userId: studentId, courseId: courseId, sessionId:sessionId})

        let grade = existingGrade ? existingGrade : defaultGrade

        let marks = []
        let gradePoints = 0
        let numAnswered = 0
        let numAnsweredTotal = 0
        const joined = _(sess.joined).contains(studentId)


        for(let iq = 0; iq < numQuestionsTotal; iq++){
          let question = questions[iq]

          const studentResponses = _(responses).where({ studentUserId: studentId, questionId: question._id })
          const response = _.max(studentResponses, (resp) => { return resp.attempt })
          let markPoints = 0
          let attempt = 0
          let responseId = "0"

          if(response && response.attempt){
            attempt = response.attempt
            responseId = response._id
              //markPoints = stats.calculateResponseGrade(response, question)
            numAnsweredTotal += 1

            if(markOutOf[iq] > 0){
              markPoints = calculateResponsePoints(response)
              numAnswered +=1
            }
          }


          //don't update a mark if its automatic flag is sest to false
          let automaticMark = true
          if (existingGrade){
            let existingMark = _(existingGrade.marks).findWhere({ questionId: question._id})
            if(existingMark && existingMark.automatic === false){
              markPoints = existingMark.points
              automaticMark = false
            }
          }
          gradePoints += markPoints

          let needsGrading = false
          if (question && !isAutoGradeable(question.type) && automaticMark &&
             question.sessionOptions && ('points' in question.sessionOptions) &&
             question.sessionOptions.points > 0 && responseId !== "0") {
             needsGrading = true
          }

          let mark = {
            questionId: question._id,
            responseId: responseId,
            attempt: attempt,
            points: markPoints,
            outOf: markOutOf[iq],
            needsGrading: needsGrading,
            automatic: automaticMark
          }
          marks.push(mark)
        }// end of questions

        // Calculate the participation grade
        let participation = 0
        if(numAnswered > 0){
          if(numQuestions > 0){
            participation = (100 * numAnswered/numQuestions)
          }else{
            // answered at least one question, but none of the questions were worth points
            participation = 100
          }
        }
        if(joined && numQuestions === 0){
          participation = 100
        }

        // if the grade is manual (not automatic), then take the value from existingGrade
        // grade.automatic can only be false if grade was set to existingGrade instead of defaultGrade
        let gradeValue = grade.automatic ? 0 : grade.value

        if(gradePoints > 0 && grade.automatic){ //only update if not an existing grade with automatic set to false
          if(gradeOutOf > 0){
            gradeValue = (100 * gradePoints/gradeOutOf)
          }else{
            gradeValue = 100
          }
        }

        grade.marks = marks
        grade.joined = joined
        grade.participation = participation
        grade.value = gradeValue
        grade.points = gradePoints
        grade.outOf = gradeOutOf
        grade.userId = studentId
        grade.numQuestions = numQuestions
        grade.numAnswered = numAnswered
        grade.numQuestionsTotal = numQuestionsTotal
        grade.numAnsweredTotal = numAnsweredTotal
        grade.visibleToStudents = sess.reviewable

        Meteor.call('grades.insert', grade)
      }//end of students
  }
}


}) // end Meteor.methods
