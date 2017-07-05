// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionResultsClassList.jsx: Student list displaying answers

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import _ from 'underscore'

import { Responses } from '../api/responses'

export class _QuestionResultsClassList extends Component {

  render () {
    return (<div className='ql-student-results-list'>
      <table className='ql-student-results-table'>
        <thead>
          <tr>
          <th>Student</th>
          <th>Participation</th>
          </tr>
        </thead>
        <tbody>
          {
            this.props.responses.map((row) => {
              return (<tr key={row._id}>
                <td>{this.props.students[row.studentUserId].getName()}</td>
                <td>✓</td>
              </tr>)
            })
          }
        </tbody>
      </table>
    </div>)
  } //  end render

}

export const QuestionResultsClassList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id) &&
    Meteor.subscribe('users.myStudents')

  const responses = Responses.find({ attempt: 1, questionId: props.question._id }).fetch()
  const students = Meteor.users.find({ _id: { $in: _(responses).pluck('studentUserId') } }).fetch()
  return {
    responses: responses,
    students: _(students).indexBy('_id'),
    loading: !handle.ready()
  }
}, _QuestionResultsClassList)

QuestionResultsClassList.propTypes = {
  question: PropTypes.object.isRequired,
  session: PropTypes.object.isRequired
}

