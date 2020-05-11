// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// grades.js: JS related to grade collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

//import { _ } from 'underscore'

import Helpers from './helpers.js'
import { Sessions } from './sessions.js'
import { Courses } from './courses.js'
import { Questions } from './questions.js'
import { Responses } from './responses.js'

import { ROLES, QUESTION_TYPE, isAutoGradeable } from '../configs'

const markPattern = {
  questionId: Match.Maybe(Helpers.NEString), // Id of question
  responseId: Match.Maybe(Helpers.NEString), // Id of response used to calculate points
  attempt: Match.Maybe(Number), // attempt for that question
  points: Match.Maybe(Number), // value of the mark for that question
  outOf: Match.Maybe(Number), // value of the mark for that question
  automatic: Match.Maybe(Boolean), // whehter the value was automatically calculated (and should be automatically updated)
  needsGrading: Match.Maybe(Boolean), // whether the points need to be set manually (for a non-autogradeable question)
  feedback: Match.Maybe(String) //feedback provided to student for that mark
}

// expected collection pattern
const gradePattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  userId: Helpers.NEString, // Id of user whose grade this is
  courseId: Match.Maybe(Helpers.NEString), // course Id of the grade
  sessionId: Match.Maybe(Helpers.NEString), // session Id of the grade
  name: Match.Maybe(String), // name of grade (defaults to session name)
  marks: Match.Maybe([ markPattern ]),// a set of marks that result in the grade
  joined: Match.Maybe(Boolean), // whether user had joined the session for this grade
  participation: Match.Maybe(Number), // fraction of questions worth points that were answered
  value: Match.Maybe(Number), // calculated value of grade, can be manually overridden
  automatic: Match.Maybe(Boolean), // whether the grade was set automatically or manually overidden
  points: Match.Maybe(Number), // number of points obtained, always calculated automatically
  outOf: Match.Maybe(Number), // total number of points available
  numAnswered: Match.Maybe(Number), // number of questions worth points answered
  numQuestions: Match.Maybe(Number), // number of questions worth points
  numAnsweredTotal: Match.Maybe(Number), // total number of questions answered
  numQuestionsTotal: Match.Maybe(Number), // total number of questions \
  visibleToStudents: Match.Maybe(Boolean),// whether grade is visible to students (non-instructors),
  needsGrading: Match.Maybe(Boolean) //whether any of the marks needs grading
}

// Create grade class
export const Grade = function (doc) { _.extend(this, doc) }
_.extend(Grade.prototype, {
  // Determine if a grade has questions that need to be graded manually that haven't been graded
  // (mark is set to automatic and of a type that is not autogradeable, and person responded)
  hasUngradedMarks: function () {
    return this.needsGrading
    /*
    let needsGrading = false
    if (!this.joined || this.numAnswered === 0) return false
    this.marks.forEach((m) => {
      if (m.needsGrading) needsGrading = true
    })
    return needsGrading*/
  },
  hasManualMarks: function () {
    let manual = false
    if (!this.automatic) return true
    if (!this.joined || this.numAnswered === 0) return false
    this.marks.forEach((m) => {
      if (!m.automatic) manual = true
    })
    return manual
  }

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
        return Grades.find({ courseId: { $in: courses || [] } })
      } else {
        return Grades.find({ userId: this.userId, visibleToStudents: true })
      }
    } else this.ready()
  })

  Meteor.publish('grades.single', function (gradeId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin)) {
        return Grades.find({ _id: gradeId })
      } else if (user.isInstructorAnyCourse()) {
        const courses = user.coursesInstructed()
        return Grades.find({ _id: gradeId, courseId: { $in: courses || [] } })
      } else {
        return Grades.find({ _id: gradeId, userId: this.userId, visibleToStudents: true })
      }
    } else this.ready()
  })

  Meteor.publish('grades.forCourse', function (courseId, fields) {
    check(courseId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin) || user.isInstructor(courseId)) {
        return Grades.find({courseId: courseId}, {fields: fields})
      } else {
        return Grades.find({ userId: this.userId, courseId: courseId, visibleToStudents: true })
      }
    } else this.ready()
  })

  Meteor.publish('grades.forSession', function (sessionId) {
    check(sessionId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const sess = Sessions.findOne({_id: sessionId})
      const courseId = sess ? sess.courseId : ''

      if (user.hasGreaterRole(ROLES.admin) || user.isInstructor(courseId)) {
        return Grades.find({sessionId: sessionId}) // finds all the course owned
      } else {
        return Grades.find({ userId: this.userId, sessionId: sessionId, visibleToStudents: true })
      }
    } else this.ready()
  })
  /*
  // This is untested... it needs to find the grades for which there is a mark with that
  // question ID, not sure if this is the righ query...
  Meteor.publish('grades.forQuestion', function (questionId) {
    check(questionId, Helpers.MongoID)
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const q = Questions.findOne({ _id: questionId})
      const sessionId = q.sessionId ? q.sessionId : ''
      const sess = Sessions.findOne({ _id: sessionId})
      const courseId = sess ? sess.courseId: ''

      if (user.hasGreaterRole(ROLES.admin) || user.isInstructor(courseId)) {
        return Grades.find({ questionId: questionId})
      } else {
        return Grades.find({ userId: this.userId, questionId: questionId, visibleToStudents: true } )
      }
    } else this.ready()
  }) */
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
  if (q.sessionOptions) {
    if ('points' in q.sessionOptions) {
      points = q.sessionOptions.points
    }
    // weights are only different from 1 if multiple attempts are allowed through maxAttempts
    // which is not incremented in a live session, only in quiz mode:
    if (q.sessionOptions.maxAttempts > 1 && q.sessionOptions.attemptWeights) {
      if (attemptNumber < q.sessionOptions.maxAttempts + 1 && attemptNumber < q.sessionOptions.attemptWeights.length + 1) {
        weight = q.sessionOptions.attemptWeights[attemptNumber - 1]
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
    case  QUESTION_TYPE.NU:
      mark =  Math.abs(Number(answer)-q.correctNumerical) <= q.toleranceNumerical ? 1 : 0
      break
  }
  return mark * points
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
    if (grade && grade._id) {
      return Meteor.call('grades.update', grade)
    }
    const user = Meteor.user()

    if (!user.hasRole(ROLES.admin) &&
         !user.isInstructor(grade.courseId)) {
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

    if (!user.hasRole(ROLES.admin) &&
         !user.isInstructor(grade.courseId)) {
      throw new Meteor.Error('not-authorized')
    }

    if (!grade) {
      throw Error('Undefined grade in update!')
    }
    const r = Grades.update({ _id: grade._id }, {
      $set: _.omit(grade, '_id')
    })

    if (r) return grade
    else throw Error('Unable to update')
  },


  /**
   * Updates a mark in a grade item
   * @param {MongoID} mark - mark object with points, outOf, studentId, questionId
   */

  'grades.updateMark' (gradeId, mark) {
    check(mark, markPattern)
    check(gradeId, Helpers.MongoID)

    if (!mark) throw Error('No mark inputted')

    // points must be positive
    if (mark.points < 0 ) throw Error('No negativ points for a mark')

    let grade = Grades.findOne({ _id: gradeId })
    if (!grade) throw Error('Undefined grade in update!')

    const user = Meteor.user()

    if (!user.hasRole(ROLES.admin) &&
          !user.isInstructor(grade.courseId)) {
      throw new Meteor.Error('not-authorized')
    }

    let gradeMarks = grade.marks
    let index = _(gradeMarks).findIndex({ questionId: mark.questionId })

    if (index>=0) {
      grade.marks[index]=mark
      Meteor.call('grades.updatePoints', grade, (err, updatedGrade) => {
        if (err) throw Error(err)
        else return updatedGrade
      })
      /*
      gradeMark.points = mark.points
      gradeMark.outOf = mark.outOf
      gradeMark.feedback = mark.feedback
      gradeMark.needsGrading = mark.needsGrading
      Meteor.call('grades.updatePoints', grade, (err) => {
        if (err) throw Error(err)
        else return Grades.update(grade._id, grade)
      })*/
    }

    else throw Error('Unable to update mark')
  },

  /**
   * Hide the grades from the students
   * @param {MongoID} sessionId - session ID
   */
  'grades.hideFromStudents' (sessionId) {
    check(sessionId, Helpers.MongoID)
    Grades.update({sessionId: sessionId}, {
      $set: { visibleToStudents: false }
    })
  },
  /**
   * Show the grades to the students
   * @param {MongoID} sessionId - session ID
   */
  'grades.showToStudents' (sessionId) {
    check(sessionId, Helpers.MongoID)
    Grades.update({sessionId: sessionId}, {
      $set: { visibleToStudents: true }
    })
  },
  /**
   * Update points for an existing grade
   * @param {MongoId} grade - grade object with id
   */
  'grades.updatePoints' (grade) {
    if (Meteor.isServer) {
      check(grade, gradePattern)

      const marks = grade.marks
      let needsGrading = false
      let gradePoints = 0
      for (let i = 0; i < marks.length; i++) {
        gradePoints += marks[i].points
        if (marks[i].needsGrading) needsGrading = true
      }

      let gradeValue = 0
      if (gradePoints > 0) {
        if (grade.outOf > 0) {
          gradeValue = (100 * gradePoints / grade.outOf)
        } else {
          gradeValue = 100
        }
      }
      grade.points = gradePoints
      if (grade.automatic) {
        grade.value = gradeValue
      }
      grade.needsGrading = needsGrading
      return Meteor.call('grades.update', grade)
    }
  },

  'grades.setMarkAutomatic' (gradeId, questionId) {
    if (Meteor.isServer) {
      check(gradeId, Helpers.MongoID)
      check(questionId, Helpers.MongoID)

      let grade = Grades.findOne({ _id: gradeId })
      if (!grade) {
        throw Error('No grade with this id')
      }
      const user = Meteor.user()

      if (!user.hasRole(ROLES.admin) &&
           !user.isInstructor(grade.courseId)) {
        throw new Meteor.Error('not-authorized')
      }

      const question = Questions.findOne({ _id: questionId })
      if (!isAutoGradeable(question.type)) {
        throw new Meteor.Error('Question type cannot be graded automatically')
      }

      let marks = grade.marks
      let mark = _(marks).findWhere({ questionId: questionId })

      if (mark) {
        const response = Responses.findOne({_id: mark.responseId})
        mark.points = calculateResponsePoints(response)
        mark.automatic = true
        Meteor.call('grades.updatePoints', grade)
      } else {
        throw Error('questionId not in grade item')
      }
    }
  },

  'grades.setGradeAutomatic' (gradeId) {
    if (Meteor.isServer) {
      check(gradeId, Helpers.MongoID)

      let grade = Grades.findOne({ _id: gradeId })
      if (!grade) {
        throw Error('No grade with this id')
      }
      const user = Meteor.user()

      if (!user.hasRole(ROLES.admin) &&
           !user.isInstructor(grade.courseId)) {
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
    if (Meteor.isServer) {
      check(gradeId, Helpers.MongoID)
      check(value, Number)

      let grade = Grades.findOne({ _id: gradeId })
      if (!grade) {
        throw Error('No grade with this id')
      }

      const user = Meteor.user()

      if (!user.hasRole(ROLES.admin) &&
           !user.isInstructor(grade.courseId)) {
        throw new Meteor.Error('not-authorized')
      }

      grade.value = value
      grade.automatic = false
      Meteor.call('grades.updatePoints', grade)
    }
  },
  /**
   * Get a participation grade for the session (average if prof, single if student)
   * @param {MongoId} sessionId - ID of session
   */
   /*TODO: Not complete! For prof, should count students that joined?
  'grades.getParticipationForSession' (sessionId) {
    check(sessionId, Helpers.MongoID)
    const user = Meteor.user()
    if (!user) throw new Meteor.Error('no such user')
    const session = Sessions.findOne({ _id: sessionId })
    if (!session) throw new Meteor.Error('no such session')
    const courseId = session.courseId
    if(user.isStudent(courseId)){
      const grade = Grades.findOne({ userId:user._id, sessionId:sessionId })
      if(!grade || !grade.joined) return 0
      else return grade.participation
    } else if (user.isInstructor(courseId)){
      const grades = Grades.find({ sessionId:sessionId }).fetch()
      let participation = 0
      for (let i=0; i<grades.length ;i ++){
        participation += grades[i].participation
      }
      return grades.length >0 ? participation/grades.length : 0
    } else return 0
  },*/

  /**
   * Set points for a mark in a grade item and recalulate grade point sum
   * @param {MongoId} gradeId - grade object with id
   * @param {MongoId} questionId - the id of the question for which to set the mark points
   * @param {Number} points- new value of the points for that grade
   */
  'grades.setMarkPoints' (gradeId, questionId, points) {
    if (Meteor.isServer) {
      check(gradeId, Helpers.MongoID)
      check(questionId, Helpers.MongoID)
      check(points, Number)

      let grade = Grades.findOne({ _id: gradeId })
      if (!grade) {
        throw Error('No grade with this id')
      }

      const user = Meteor.user()

      if (!user.hasRole(ROLES.admin) &&
           !user.isInstructor(grade.courseId)) {
        throw new Meteor.Error('not-authorized')
      }

      let marks = grade.marks
      let mark = _(marks).findWhere({ questionId: questionId })

      if (mark) {
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
  'grades.calcSessionGrades' (sessionId) {
    if (Meteor.isServer) { // only run this on the server!
      const user = Meteor.user()
      const sess = Sessions.findOne({_id: sessionId})
      if (!sess) {
        throw Error('No session with this id')
      }
      const courseId = sess ? sess.courseId : ''
      const course = Courses.findOne({_id: courseId})

      if (!user.hasGreaterRole(ROLES.admin) && !user.isInstructor(courseId)) {
        throw Error('Unauthorized to grade session')
      }

      // questions in the session
      const qIds = sess ? sess.questions : []
      // responses corresponding to questions in the session
      const responses = Responses.find({questionId: {$in: qIds}}).fetch()
      // questions in the session (sort to be in the same order)
      let questionsUnsorted = Questions.find({_id: {$in: qIds}}).fetch()
      let questions = []
      qIds.forEach((qId) => {
        questions.push(_(questionsUnsorted).findWhere({_id: qId}))
      })

      // the total number of questions in the session (that have responses)
      const numQuestionsTotal = questions.length

      // count the questions that are worth points, keep track of total marks for each question
      let numQuestions = 0 // worth points
      let markOutOf = []
      let gradeOutOf = 0
      for (let iq = 0; iq < numQuestionsTotal; iq++) {
        let question = questions[iq]
        // assume that it is worth 1 point
        markOutOf.push(1)

        // TODO: Check this still makes sense
        // Assume that short answer is not worth any points if the points were not set
        // This is to deal with backwards compatibility for questions that were in the DB
        // before points were assigned and SA were counted in participation if any answer was entered
        if (question.type === QUESTION_TYPE.SA) {
          markOutOf[iq] = 0
        }
        // except if the number of points was assigned to the SA (or other question)
        if (question.sessionOptions && ('points' in question.sessionOptions)) {
          markOutOf[iq] = question.sessionOptions.points
        }
        if (markOutOf[iq] > 0) {
          numQuestions += 1
        }
        gradeOutOf += markOutOf[iq]
      }

      const studentIds = course.students ? course.students : []

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

      for (let is = 0; is < studentIds.length; is++) {
        const studentId = studentIds[is]
        let existingGrade = Grades.findOne({userId: studentId, courseId: courseId, sessionId: sessionId})

        let grade = existingGrade || defaultGrade
        let marks = []
        let gradePoints = 0
        let numAnswered = 0
        let numAnsweredTotal = 0
        const joined = _(sess.joined).contains(studentId)

        for (let iq = 0; iq < numQuestionsTotal; iq++) {
          let question = questions[iq]

          const studentResponses = _(responses).where({ studentUserId: studentId, questionId: question._id })
          const response = _.max(studentResponses, (resp) => { return resp.attempt })
          let markPoints = 0
          let feedback = ''
          let attempt = 0
          let responseId = '0'

          if (response && response.attempt) {
            attempt = response.attempt
            responseId = response._id
            numAnsweredTotal += 1

            if (markOutOf[iq] > 0) {
              markPoints = calculateResponsePoints(response)
              numAnswered += 1
            }
          }

          // don't update a mark if its automatic flag is set to false
          let automaticMark = true
          let needsGrading = false

          if (existingGrade) {
            let existingMark = _(existingGrade.marks).findWhere({questionId: question._id})
            if (existingMark && (existingMark.automatic === false || !isAutoGradeable(question.type) )) {
              markPoints = existingMark.points
              automaticMark = false
            }
            if (existingMark && 'feedback' in existingMark){
              feedback = existingMark.feedback
            }

            if (existingMark && !isAutoGradeable(question.type)){
              needsGrading = existingMark.needsGrading
            }
          }
          gradePoints += markPoints

          if (question && !isAutoGradeable(question.type) && automaticMark &&
             question.sessionOptions && ('points' in question.sessionOptions) &&
             question.sessionOptions.points > 0 && responseId !== '0') {
            needsGrading = true
            grade.needsGrading = true
          }

          if(needsGrading) grade.needsGrading = true

          let mark = {
            questionId: question._id,
            responseId: responseId,
            attempt: attempt,
            points: markPoints,
            outOf: markOutOf[iq],
            needsGrading: needsGrading,
            automatic: automaticMark,
            feedback: feedback
          }
          marks.push(mark)
        }// end of questions

        // Calculate the participation grade
        let participation = 0
        if (numAnswered > 0) {
          if (numQuestions > 0) {
            participation = (100 * numAnswered / numQuestions)
          } else {
            // answered at least one question, but none of the questions were worth points
            participation = 100
          }
        }
        if (joined && numQuestions === 0) {
          participation = 100
        }

        // if the grade is manual (not automatic), then take the value from existingGrade
        // grade.automatic can only be false if grade was set to existingGrade instead of defaultGrade
        let gradeValue = grade.automatic ? 0 : grade.value

        if (gradePoints > 0 && grade.automatic) { // only update if not an existing grade with automatic set to false
          if (gradeOutOf > 0) {
            gradeValue = (100 * gradePoints / gradeOutOf)
          } else {
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
      }// end of students
    }
  }

}) // end Meteor.methods
