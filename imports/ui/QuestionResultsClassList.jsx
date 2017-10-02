// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionResultsClassList.jsx: Student list displaying answers

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import _ from 'underscore'

import { Responses } from '../api/responses'
import { QUESTION_TYPE } from '../configs'
import { Stats } from '../stats'

export class _QuestionResultsClassList extends Component {

  render () {
    const stats = new Stats([this.props.question], this.props.responses)
    const students = this.props.students || []
    const attempts = (this.props.question && this.props.question.sessionOptions &&
       this.props.question.sessionOptions.attempts)
       ? _(this.props.question.sessionOptions.attempts).sortBy((a) => { return a.number }) : []

    return (<div className='ql-student-results-list'>
      <table className='ql-student-results-table'>
        <thead>
          <tr>
            <th>Student</th>
            {attempts.map((attempt) => {
              return (<th key={'att_' + attempt.number}>Attempt: {attempt.number}</th>)
            })
            }
            <th>Mark</th>
          </tr>
        </thead>
        <tbody>
          {students.map((user) => {
            const responses = _(this.props.responses).where({studentUserId: user._id})
            let grade = (this.props.question.type === QUESTION_TYPE.SA) ? 'N/A' : 0
            return (<tr key={user._id}>
              <td>{user.getName()}</td>
              {attempts.map((attempt) => {
                const response = _(responses).findWhere({attempt: attempt.number})
                const key = user._id + '_' + this.props.question._id + '_' + attempt.number
                const answer = response ? response.answer : ''
                  // only update the grade if there is a later attempt
                if (response && this.props.question.type !== QUESTION_TYPE.SA) {
                  grade = stats.calculateResponseGrade(response, this.props.question)
                }
                const answerStr = response ? answer + ' (' + grade + ')' : ''
                return (<td key={key}>{answerStr}</td>)
              })
                }
              <td>{this.props.question.type !== QUESTION_TYPE.SA
                  ? 100 * grade // stats.calculateResponseGrade(response)
                  : 'N/A'
                }</td></tr>)
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
  const students = Meteor.users.find({_id: { $in: _(responses).pluck('studentUserId') }}, {sort: {'profile.lastname': 1}}).fetch()

  return {
    responses: responses,
    students: students,
    loading: !handle.ready()
  }
}, _QuestionResultsClassList)

QuestionResultsClassList.propTypes = {
  question: PropTypes.object.isRequired,
  session: PropTypes.object.isRequired
}
