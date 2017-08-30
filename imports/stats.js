// QLICKER
// Author: Enoch T <me@enocht.am>
//
// stats.js: various methods for calculating response and answer numbers
import _ from 'underscore'

import { QUESTION_TYPE } from './configs'

class Stats {

  constructor (questions = [], responses = []) {
    // A question only counts as being asked if there is a response for it
    const asked = _.filter(questions, (q) => { return _.findWhere(responses, {questionId: q._id}) })
    // Short answer questions are not counted
    const excludeSA = _.reject(asked, (q) => { return q.type === QUESTION_TYPE.SA })
    this.questions = excludeSA
    this.responses = _.filter(responses, (resp) => {
      return _.find(excludeSA, (q) => { return q._id === resp.questionId })
    })
    this.numQuestions = excludeSA.length
  }

  sessionParticipation (studentId) {
    const numResponses = _.uniq(_.where(this.responses, {studentUserId: studentId}), 'questionId').length || 0
    return this.numQuestions ? (numResponses / this.numQuestions * 100).toFixed(0) : 0
  }

  sessionGrade (studentId) {
    const studentResponses = _.where(this.responses, {studentUserId: studentId})
    const grouped = _.groupBy(studentResponses, (resp) => {
      return resp.questionId
    })
    const responses = _.mapObject(grouped, (responses) => {
      return _.max(responses, (resp) => { return resp.attempt })
    })
    const marks = _.pluck(responses, 'mark')
    const mark = _.reduce(marks, (memo, num) => { return memo + num }, 0)

    return this.numQuestions ? (mark / this.numQuestions * 100).toFixed(0) : 0
  }

  questionParticipation (qId, studentId) {
    const response = _.find(this.responses, (r) => { return r.studentUserId === studentId && r.questionId === qId })
    return response ? 100 : 0
  }

  questionGrade (qId, studentId) {
    const responses = _.filter(this.responses, (r) => { return r.studentUserId === studentId && r.questionId === qId })
    const response = _.max(responses, (resp) => { return resp.attempt })
    return (response && response.mark) ? (response.mark * 100).toFixed(0) : 0
  }
}

export { Stats }
