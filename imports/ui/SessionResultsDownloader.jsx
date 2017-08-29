// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'
import { CSVLink } from 'react-csv'

import { Questions } from '../api/questions'
import { Courses } from '../api/courses'
import { Responses } from '../api/responses'

import { QUESTION_TYPE } from '../configs'

export class _SessionResultsDownloader extends Component {

  render () {
    const headers = ['Name', 'Participation mark', 'Answered', 'Correct']
    const asked = _.uniq(_.pluck(this.props.responses, 'questionId'))

    let data = this.props.students.map((student) => {
      const studentResponses = _.filter(this.props.responses, resp => { return resp.studentUserId === student._id })
      let totalQuestions = 0
      let correctAnswers = 0

      this.props.questions.forEach((q) => {
        const len = q.sessionOptions.attempts ? q.sessionOptions.attempts.length : 0
        totalQuestions += len
        for (var i = 1; i <= len; i++) {
          const correct = _.map(_.filter(q.options, {correct: true}), (op) => op.answer) // correct responses
          let resp = _.findWhere(studentResponses, {questionId: q._id, attempt: i}) // student responses
          resp = resp ? resp.answer : ''
          switch (q.type) {
            case QUESTION_TYPE.MC:
              correctAnswers += correct[0] === resp ? 1 : 0
              break
            case QUESTION_TYPE.TF:
              correctAnswers += correct[0] === resp ? 1 : 0
              break
            case QUESTION_TYPE.SA:
              correctAnswers += resp ? 1 : 0
              break
            case QUESTION_TYPE.MS: // (correct responses-incorrect responses)/(correct answers)
              const intersection = _.intersection(correct, resp)
              const percentage = (2 * intersection.length - resp.length) / correct.length
              correctAnswers += percentage > 0 ? percentage : 0
              break
          }
        }
      })

      const uniqueResponses = _.uniq(studentResponses, 'questionId')
      const mark = (uniqueResponses.length / asked.length)
      const participation = mark >= 0.5 ? 1 : 0
      const row = [student.getName(), participation, mark, correctAnswers / totalQuestions]
      return row
    })
    const filename = this.props.session.name.replace(/ /g, '_') + '_results.csv'
    return (<CSVLink data={data} headers={headers} filename={filename}>
      <span className='btn pull-right'>Export as .csv</span>
    </CSVLink>)
  } //  end render

}

export const SessionResultsDownloader = createContainer((props) => {
  const handle = Meteor.subscribe('courses', {isInstructor: Meteor.user().isInstructor(props.session.courseId)}) &&
    Meteor.subscribe('questions.inSession', props.session._id) &&
    Meteor.subscribe('responses.forSession', props.session._id) &&
    Meteor.subscribe('users.myStudents', {cId: props.session.courseId})

  const course = Courses.find({ _id: props.session.courseId }).fetch()[0]

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  const questions = Questions.find({ sessionId: props.session._id }).fetch()

  const responses = Responses.find().fetch()

  return {
    responses: responses,
    students: students,
    questions: questions,
    loading: !handle.ready()
  }
}, _SessionResultsDownloader)

SessionResultsDownloader.propTypes = {
  session: PropTypes.object.isRequired
}

