// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentQuestionResultsClassList.jsx: List displaying student session results

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { QuestionDisplay } from './QuestionDisplay'

import { QUESTION_TYPE } from '../configs'

import _ from 'underscore'

import { Responses } from '../api/responses'

export class _StudentQuestionResultsClassList extends Component {
  render () {
    const q = this.props.question
    const correct = _.pluck(_.where(q.options, {correct: true}), 'answer')
    const attemptRow = q.studentResponses.map((row) => {
      let inner

      switch (q.type) {
        case QUESTION_TYPE.MC:
          inner = row.answer + (correct[0] === row.answer ? ' ✓' : ' ✗')
          break
        case QUESTION_TYPE.TF:
          inner = row.answer + (correct[0] === row.answer ? ' ✓' : ' ✗')
          break
        case QUESTION_TYPE.SA:
          inner = row.answer
          break
        case QUESTION_TYPE.MS:
          const isSame = _.intersection(correct, row.answer).length === correct.length
          inner = row.answer.sort().join(', ') + (isSame ? ' ✓' : ' ✗')
          break
      }
      return (<tr key={row.attempt}>
        <td>{row.attempt}</td>
        <td>{inner}</td>
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
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)

  const responses = Responses.find({ questionId: props.question._id, studentUserId: Meteor.userId() }).fetch()
  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _StudentQuestionResultsClassList)

StudentQuestionResultsClassList.propTypes = {
  question: PropTypes.object.isRequired
}

