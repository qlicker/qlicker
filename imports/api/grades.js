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

import { ROLES, QUESTION_TYPE } from '../configs'

// expected collection pattern
const gradePattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  userId: Helpers.NEString, // Id of user whose grade this is
  courseId: Match.Maybe(Helpers.NEString), // course Id of the grade
  sessionId: Match.Maybe(Helpers.NEString), // session Id of the grade
  name: Match.Maybe(String),// name of grade (defaults to session name)
  marks: Match.Maybe([ { // a set of marks that result in the grade
    questionId: Match.Maybe(Helpers.NEString), //Id of question
    attempt: Match.Maybe(Number), //attempt for that question
    points: Match.Maybe(Number), // value of the mark for that question
    outOf: Match.Maybe(Number), // value of the mark for that question
    automatic: Match.Maybe(Boolean), //whehter the value was automatically calculated (and should be automatically updated)
  } ]),
  points: Match.Maybe(Number), // number of points obtained
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

  Meteor.publish('grades.forCourse', function (courseId) {
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
         !user.isInstructorAnyCourse() ) {
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
         !user.isInstructorAnyCourse() ) {
      throw new Meteor.Error('not-authorized')
    }

    const r = Grades.update({ _id: grade._id }, {
      $set: _.omit(grade, '_id')
    })

    if (r) return grade
    else throw Error('Unable to update')
  },

  'grades.calcSessionGrades' (sessionId){
    const user = Meteor.user()
    const sess = Sessions.findOne({ _id: sessionId})
    const courseId = sess ? sess.courseId: ''
    const course = Courses.findOne({ _id: courseId})

    if (!user.hasGreaterRole(ROLES.admin) && !user.isInstructor(courseId)) {
      throw Error('Unauthorized to grade session')
    }
    const qIds = sess.questions
    const questions = Questions.find({ _id: { $in: qIds}}).fetch()
    const responses = Responses.find({ questionId: { $in: qIds}}).fetch()
    const studentIds = course.students
    const stats = new Stats(questions, responses)

    const defaultGrade = {
      courseId: courseId,
      sessionId: sessionId,
      name: sess.name,
      points: 0,
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
      let gradeOutOf = 0
      let gradePoints = 0
      let numAnswered = 0
      let numQuestions = 0
      let numAnsweredTotal = 0
      let numQuestionsTotal = 0

      for(let iq = 0; iq < questions.length; iq++){
        let question = questions[iq]
        numQuestionsTotal += 1
        let markOutOf = 1
        if(question.type === QUESTION_TYPE.SA){
           markOutOf = 0
        }
        if (question.sessionOptions && question.sessionOptions.points){
           markOutOf = question.sessionOptions.points
        }

        gradeOutOf += markOutOf
        let studentResponses = _(responses).where({ studentUserId: studentId, questionId: question._id })
        let response = _.max(studentResponses, (resp) => { return resp.attempt })
        let markPoints = 0
        let attempt = 0

        if(response.attempt){
          attempt = response.attempt
          markPoints = stats.calculateResponseGrade(response, question)
          numAnsweredTotal += 1
          if(markOutOf > 0){
            numAnswered +=1
          }
        }
        gradePoints += markPoints

        if(markOutOf > 0){
          numQuestions +=1
        }

       //don't update a mark if its automatic flag is sest to false
        if (existingGrade){
          let existingMark = _(existingGrade.marks).findWhere({ questionId: question._id})
          if(existingMark && existingMark.automatic === false){
            continue
          }
        }

        let mark = {
          questionId: question._id,
          attempt: attempt,
          points: markPoints,
          outOf: markOutOf,
          automatic: true
        }
        marks.push(mark)
      }//end of questions

      grade.marks = marks
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
