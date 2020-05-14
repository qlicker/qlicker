// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionResultsClassList.jsx: Student list displaying answers

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { createContainer } from 'meteor/react-meteor-data'

import _ from 'underscore'

import { WysiwygHelper } from '../wysiwyg-helpers'
import { Responses } from '../api/responses'
import { calculateResponsePoints } from '../api/grades'
import { QUESTION_TYPE } from '../configs'
// import { Stats } from '../stats'

export class _QuestionResultsClassList extends Component {

  render () {
    // const stats = new Stats([this.props.question], this.props.responses)
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
            const responses = _(this.props.responses).where({ studentUserId: user._id })
            let markByAttempt = 0
            const maxPoints = this.props.question && this.props.question.sessionOptions && 'points' in this.props.question.sessionOptions
                           ? this.props.question.sessionOptions.points
                           : 1
            return (<tr key={user._id}>
              <td>{user.getName()}</td>
              {attempts.map((attempt) => {
                const response = _(responses).findWhere({attempt: attempt.number})
                const key = user._id + '_' + this.props.question._id + '_' + attempt.number
                let answer = response ? response.answer : ''
                answer = (response && this.props.question.type === QUESTION_TYPE.SA && response.answerWysiwyg) ? WysiwygHelper.htmlDiv(response.answerWysiwyg) : answer

                markByAttempt = calculateResponsePoints(response)

                return (<td key={key}>{answer} ({markByAttempt})</td>)
              })
              }
              <td>{markByAttempt}/{maxPoints}</td>
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
                 Meteor.subscribe('users.studentsInCourse', props.session.courseId)

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
