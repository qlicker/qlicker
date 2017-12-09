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
    automatic: Match.Maybe(Boolean), //whehter the value was automatically calculated (and should be automatically updated)
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
  if (!response || !response.attempt) return 0
  const q = Questions.findOne({ _id: response.questionId })
  const resp = response.answer
  if (!q || !resp) return 0
  if (!isAutoGradeable(q)) return 0

  const correct = _.map(_.filter(q.options, {correct: true}), (op) => op.answer) // correct responses
  const attempt = resp.attempt
  let points = 1

  let weight = 1
  if(q.sessionOptions){
    if(q.sessionOptions.points){
      points = q.sessionOptions.points
    }
    const qAttempt = _(q.sessionOptions).findWhere({ number:attempt})
    if (qAttempt && qAttempt.weight){
      weight = qAttempt.weight
    }
  }
  let mark = 0
  switch (q.type) {
    case QUESTION_TYPE.MC:
      mark = correct[0] === resp ? 1 : 0
      break
    case QUESTION_TYPE.TF:
      mark = correct[0] === resp ? 1 : 0
      break
    case QUESTION_TYPE.SA: // 1 if any answer
      mark = resp ? 1 : 0
      break
    case QUESTION_TYPE.MS: // (correct responses-incorrect responses)/(correct answers)
      const intersection = _.intersection(correct, resp)
      const percentage = (2 * intersection.length - resp.length) / correct.length
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
    if(grade._id){
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
    check(grade._id, Helpers.MongoID)
    check(grade, gradePattern)
    const user = Meteor.user()

    if ( !user.hasRole(ROLES.admin) &&
         !user.isInstructor(grade.courseId)  ) {
      throw new Meteor.Error('not-authorized')
    }

    const r = Grades.update({ _id: grade._id }, {
      $set: _.omit(grade, '_id')
    })

    if (r) return grade
    else throw Error('Unable to update')
  },

  /**
   * Update points for an existing grade
   * @param {MongoId} grade - grade object with id
   */
  'grades.updatePoints' (grade) {
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
  },

  'grades.setMarkAutomatic' (gradeId, questionId) {
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
  },

  'grades.setGradeAutomatic' (gradeId) {
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
  },
  /**
   * Set the grade value directly
   * @param {MongoId} gradeId - grade object with id
   * @param {Number} value- new value for the grade
   */
  'grades.setGradeValue' (gradeId, value) {
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
  },

  /**
   * Set points for a mark in a grade item and recalulate grade point sum
   * @param {MongoId} gradeId - grade object with id
   * @param {MongoId} questionId - the id of the question for which to set the mark points
   * @param {Number} points- new value of the points for that grade
   */
  'grades.setMarkPoints' (gradeId, questionId, points) {
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
      Meteor.call('grades.updatePoints', grade)
    } else {
      throw Error('questionId not in grade item')
    }
  },

  /**
   * Calculate all grades for a session
   * @param {MongoID} sessionId - session ID
   */
  'grades.calcSessionGrades' (sessionId){

    const user = Meteor.user()
    const sess = Sessions.findOne({ _id: sessionId})
    const courseId = sess ? sess.courseId: ''
    const course = Courses.findOne({ _id: courseId})

    if (!user.hasGreaterRole(ROLES.admin) && !user.isInstructor(courseId)) {
      throw Error('Unauthorized to grade session')
    }
    // questions in the session
    const qIds = sess.questions
    // responses corresponding to questions in the session
    const responses = Responses.find({ questionId: { $in: qIds}}).fetch()
    // questions in the session
    let questions = []  //Questions.find({ _id: { $in: qIds}}).fetch()
    qIds.forEach( (qId) => {
      questions.push(Questions.findOne({ _id: qId }))
    })

    // TODO: Keep all, and assume that prof has set 0 points for questions that don't have points
    // of the questions in the sessions, the ones that have responses - REMOVE this //TODO
    questions = _.filter(questions, (q) => { return _.findWhere(responses, {questionId: q._id}) })

    //the total number of questions in the session (that have responses)
    const numQuestionsTotal = questions.length

    //count the questions that are worth points, keep track of total marks for each question
    let numQuestions = 0
    let markOutOf = []
    let gradeOutOf = 0
    for(let iq = 0; iq < numQuestionsTotal; iq++){
      let question  = questions[iq]
      markOutOf.push(1)
      // Assume that SA is not worth any points
      // TODO: Remove this!!!
      if(question.type === QUESTION_TYPE.SA){
         markOutOf[iq] = 0
      }
      // except if the number of points was assigned to the SA (or other question)
      if (question.sessionOptions && question.sessionOptions.points > 0){
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
      visibleToStudents: false,
      marks: []
    }

    for(let is = 0; is < studentIds.length; is++){
      let studentId = studentIds[is]
      let existingGrade = Grades.findOne({ userId: studentId, courseId: courseId, sessionId:sessionId})

      let grade = existingGrade ? existingGrade : defaultGrade

      let marks = []
      let gradePoints = 0
      let numAnswered = 0
      let numAnsweredTotal = 0
      let joined = _(sess.joined).contains(studentId)


      for(let iq = 0; iq < numQuestionsTotal; iq++){
        let question = questions[iq]

        let studentResponses = _(responses).where({ studentUserId: studentId, questionId: question._id })
        let response = _.max(studentResponses, (resp) => { return resp.attempt })
        let markPoints = 0
        let attempt = 0
        let responseId = "0"

        if(response.attempt){
          attempt = response.attempt
          responseId = response._id
            //markPoints = stats.calculateResponseGrade(response, question)
          numAnsweredTotal += 1
          if(markOutOf[iq] > 0){
            markPoints = calculateResponsePoints(response)
            numAnswered +=1
          }
        }
        gradePoints += markPoints

       //don't update a mark if its automatic flag is sest to false
        if (existingGrade){
          let existingMark = _(existingGrade.marks).findWhere({ questionId: question._id})
          if(existingMark && existingMark.automatic === false){
            continue
          }
        }

        let mark = {
          questionId: question._id,
          responseId: responseId,
          attempt: attempt,
          points: markPoints,
          outOf: markOutOf[iq],
          automatic: true
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
      let gradeValue = 0
      if(gradePoints > 0){
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

      Meteor.call('grades.insert', grade)
    }//end of students

  }


}) // end Meteor.methods
