// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionResultsClassList.jsx: Student list displaying answers

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import _ from 'underscore'

import { Responses } from '../api/responses'

import { Stats } from '../stats'

export class _QuestionResultsClassList extends Component {

  render () {
    const stats = new Stats([this.props.question], this.props.responses)
    return (<div className='ql-student-results-list'>
      <table className='ql-student-results-table'>
        <thead>
          <tr>
            <th>Student</th>
            <th>{this.props.question.type === 2 ? 'Response' : 'Mark'}</th>
          </tr>
        </thead>
        <tbody>
          {
            _.uniq(this.props.responses, 'questionId').map((row) => {
              const user = this.props.students[row.studentUserId]
              return (<tr key={row._id}>
                <td>{user.getName()}</td>
                {this.props.question.type === 2
                  ? <td>{row.answer}</td>
                  : <td>{stats.questionGrade(this.props.question._id, user._id)}</td>
                }
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
    Meteor.subscribe('users.myStudents', {cId: props.session.courseId})

  const responses = Responses.find({ questionId: props.question._id }).fetch()
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

