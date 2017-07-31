// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentQuestionResultsClassList.jsx: List displaying student session results

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { QuestionDisplay } from './QuestionDisplay'

import _ from 'underscore'

import { Responses } from '../api/responses'

export class _StudentQuestionResultsClassList extends Component {
  render () {
    const q = this.props.question

    const attemptRow = q.studentResponses.map((row) => {
      return (<tr key={row.attempt}>
        <td>{row.attempt}</td>
        <td> {typeof row.answer === 'string' ? row.answer : row.answer.join(', ')}</td>
      </tr>)
    })

    return (<div className='ql-student-results-list'>
      <div style={{float: 'left', width: '50%'}}>
        <QuestionDisplay style={{float: 'right'}} question={q} readonly noStats forReview />
      </div>
      <div style={{float: 'right', width: '50%'}}>
        <table style={{float: 'right', margin: '15px'}} className='ql-student-results-table'>
          <thead>
            <tr>
              <th>Attempt #</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            {attemptRow}
          </tbody>
        </table>
      </div>
    </div>)
  } //  end render

}

export const StudentQuestionResultsClassList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id) &&
    Meteor.subscribe('users.myStudents')

  const responses = Responses.find({ attempt: 1, questionId: props.question._id }).fetch()
  const students = Meteor.users.find({ _id: { $in: _(responses).pluck('studentUserId') } }).fetch()
  return {
    responses: responses,
    students: _(students).indexBy('_id'),
    loading: !handle.ready()
  }
}, _StudentQuestionResultsClassList)

StudentQuestionResultsClassList.propTypes = {
  question: PropTypes.object.isRequired,
  session: PropTypes.object.isRequired
}

