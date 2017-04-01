// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ShortAnswerList.jsx

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Responses } from '../api/responses'

/**
 * React component (meteor reactive) that displays a list of short answer reponses for a question
 * @prop {Question} question - question object
 */
class _ShortAnswerList extends Component {

  render () {
    if (this.props.loading) return <div>Loading</div>
    return (<div className='ql-short-answer-list'>
      <h3>Responses</h3>
      {
        this.props.responses.map(r => <div className='ql-short-answer-item'>{r.answer}</div>)
      }
    </div>)
  } //  end render

}

export const ShortAnswerList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const responses = Responses.find({ questionId: props.question._id }, { sort: { createdAt: -1 } }).fetch()

  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _ShortAnswerList)

ShortAnswerList.propTypes = {
  question: PropTypes.object.isRequired
}

