// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentQuestionResultsListItem.jsx: List displaying student session results

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Responses } from '../api/responses'

export class _StudentQuestionResultsListItem extends Component {

  render () {
    const q = this.props.question
    const attempts = 'Attempts: ' + q.studentResponses.length + '/' + q.sessionOptions.attempts.length

    return (<div className='ql-results-list-item ql-list-item'>
      <span className='title'>{(this.props.index + 1) + '. ' + q.plainText}</span>
      <span style={{float: 'right'}} className='title'>{attempts}</span>
    </div>)
  } //  end render

}

export const StudentQuestionResultsListItem = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const responses = Responses.find({ questionId: props.question._id }).fetch()

  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _StudentQuestionResultsListItem)

StudentQuestionResultsListItem.propTypes = {
  question: PropTypes.object.isRequired,
  session: PropTypes.object.isRequired
}

