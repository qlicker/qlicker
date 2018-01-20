// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentQuestionResultsClassList.jsx: List displaying student session results

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { WysiwygHelper } from '../wysiwyg-helpers'
// import { QuestionDisplay } from './QuestionDisplay'
import { QuestionWithResponseArray } from './QuestionWithResponseArray'

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
          inner = row.answerWysiwyg ? WysiwygHelper.htmlDiv(row.answerWysiwyg) : row.answer
          break
        case QUESTION_TYPE.MS:
          const intersection = _.intersection(correct, row.answer)
          const isSame = (intersection.length === correct.length) && (correct.length === row.answer.length)
          inner = row.answer.sort().join(', ') + (isSame ? ' ✓' : ' ✗')
          break
      }
      return (<tr key={row.attempt}>
        <td>{row.attempt}</td>
        <td>{inner}</td>
      </tr>)
    })

    return (<div className='ql-student-results-list'>
      <div className='col-sm-8'>
        <QuestionWithResponseArray style={{float: 'right'}} question={q} responses={this.props.responses} />
      </div>
      <div className='col-sm-4'>
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

  const responses = Responses.find({ questionId: props.question._id, studentUserId: Meteor.userId() },
                                   {sort: {attempt: 1}}).fetch()
  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _StudentQuestionResultsClassList)

StudentQuestionResultsClassList.propTypes = {
  question: PropTypes.object.isRequired
}
