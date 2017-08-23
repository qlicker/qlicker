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
import { Sessions } from '../api/sessions'
import { Responses } from '../api/responses'

import { QUESTION_TYPE } from '../configs'

export class _CourseResultsDownloader extends Component {

  render () {
    let headers = ['Name']

    this.props.sessions.forEach((s, sIndex) => {
      s.questions.forEach((q, qIndex) => {
        const question = _.find(this.props.questions, ques => { return ques._id === q })
        const len = (question && question.sessionOptions.attempts) ? question.sessionOptions.attempts.length : 0
        for (var i = 1; i <= len; i++) {
          headers.push('S' + (sIndex + 1) + '- Q' + (s.questions.indexOf(q) + 1) + '- A' + i)
        }
      })
    })

    let data = this.props.students.map((student) => {
      const studentResponses = _.filter(this.props.responses, resp => { return resp.studentUserId === student._id })
      let row = [student.getName()]

      this.props.sessions.forEach((s, sIndex) => {
        s.questions.forEach((q, qIndex) => {
          const question = _.find(this.props.questions, ques => { return ques._id === q })
          const len = (question && question.sessionOptions.attempts) ? question.sessionOptions.attempts.length : 0
          for (var i = 1; i <= len; i++) {
            const correct = _.map(_.filter(question.options, {correct: true}), (op) => op.answer) // correct responses
            let resp = _.findWhere(studentResponses, {questionId: q, attempt: i}) // student responses
            resp = resp ? resp.answer : ''
            switch (question.type) {
              case QUESTION_TYPE.MC:
                row.push(correct[0] === resp ? 1 : 0)
                break
              case QUESTION_TYPE.TF:
                row.push(correct[0] === resp ? 1 : 0)
                break
              case QUESTION_TYPE.SA:
                row.push(resp ? 1 : 0)
                break
              case QUESTION_TYPE.MS: // (correct responses-incorrect responses)/(correct answers)
                const intersection = _.intersection(correct, resp)
                const percentage = (2 * intersection.length - resp.length) / correct.length
                row.push(percentage > 0 ? percentage : 0)
                break
            }
          }
        })
      })
      return row
    })

    const filename = this.props.course.name.replace(/ /g, '_') + '_results.csv'

    return (<CSVLink data={data} headers={headers} filename={filename}>
      <div type='button' className='btn btn-secondary'>
        Export as .csv
      </div>
    </CSVLink>)
  } //  end render

}

export const CourseResultsDownloader = createContainer((props) => {
  const handle = Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inCourse', props.course._id) &&
    Meteor.subscribe('responses.forCourse', props.course._id) &&
    Meteor.subscribe('users.myStudents', {cId: props.course._id})

  const studentIds = props.course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  const sessions = Sessions.find({ _id: { $in: props.course.sessions } }, { sort: { date: 1 } }).fetch()

  const questions = Questions.find({ courseId: props.course._id, sessionId: { $exists: true } }).fetch()

  const responses = Responses.find().fetch()

  return {
    sessions: sessions,
    responses: responses,
    students: students,
    questions: questions,
    loading: !handle.ready()
  }
}, _CourseResultsDownloader)

CourseResultsDownloader.propTypes = {
  course: PropTypes.object.isRequired
}
