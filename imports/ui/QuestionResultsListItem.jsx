// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionResultsListItem.jsx: Student list displaying answers

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Responses } from '../api/responses'

export class _QuestionResultsListItem extends Component {

  render () {
    const q = this.props.question
    const total = this.props.session.joined ? this.props.session.joined.length : 0
    return (<div className='ql-results-list-item ql-list-item'>
      <span className='title'>{q.plainText}</span>
      <span className='details'># Responses: { this.props.responses.length }/{ total }</span>
    </div>)
  } //  end render

}

export const QuestionResultsListItem = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const responses = Responses.find({ questionId: props.question._id }).fetch()

  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _QuestionResultsListItem)

QuestionResultsListItem.propTypes = {
  question: PropTypes.object.isRequired,
  session: PropTypes.object.isRequired
}

