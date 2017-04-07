// QLICKER
// Author: Enoch T <me@enocht.am>
//
// stats.js: various methods for calculating response and answer numbers
import _ from 'underscore'
import dl from 'datalib'

class Participation {

  constructor (sessions = {}, questions = [], responses = []) {
    this.sessions = sessions
    this.questions = questions
    this.responses = responses
  }


  percentage (sId, studentUserId) {
    // group and index question/response arrays
    const groupedResponses = dl.groupby('studentUserId').execute(this.responses)
    groupedResponses.forEach(r => {
      r.questions = dl.groupby('questionId').execute(r.values)
    })
    this.indexedResponses = _(groupedResponses).indexBy('studentUserId')
    this.indexedQuestions = _.indexBy(this.questions, '_id')

    // calculate percentage answered
    const session = this.sessions[sId]
    if ((session.joined || []).indexOf(studentUserId) === -1) return 0

    // count number of question * attemps
    let max = 0
    ;(session.questions || []).forEach(qId => {
      const q = this.indexedQuestions[qId]
      max += q && q.sessionOptions ? q.sessionOptions.attempts.length : 0
    })

    // count number that this student has answered
    let answered = 0
    const res = this.indexedResponses[studentUserId]
    if (!res || !res.questions) return 0

    const groupedQsInSession = res.questions.filter(q => session.questions.indexOf(q.questionId) > -1)
    groupedQsInSession.forEach(q => {
      answered += q.values.length
    })
    return max > 0 ? answered / max : 0
  }


}

export { Participation }
