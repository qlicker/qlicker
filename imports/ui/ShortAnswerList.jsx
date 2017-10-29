// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ShortAnswerList.jsx

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { WysiwygHelper } from '../wysiwyg-helpers'
import { Responses } from '../api/responses'

/**
 * React component (meteor reactive) that displays a list of short answer reponses for a question
 * @prop {Question} question - question object
 */
class _ShortAnswerList extends Component {

  renderAnswer (r) {
    const user = Meteor.users.findOne(r.studentUserId)
    const name = user ? user.getName() : 'Unknown'
    const answer = r.answerWysiwyg ? WysiwygHelper.htmlDiv(r.answerWysiwyg) : r.answer

    return (
      <div>
        {name}: {answer}
      </div>
    )
  }

  render () {
    if (this.props.loading) return <div>Loading</div>
    return (<div className='ql-short-answer-list'>
      <h3>Responses</h3>
      {
        this.props.responses.map(r => <div key={r._id} className='ql-short-answer-item'>{this.renderAnswer(r)}</div>)
      }
    </div>)
  } //  end render

}

export const ShortAnswerList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const question = props.question
  const attemptNumber = question.sessionOptions.attempts.length
  // Get the responses for that attempt:
  const responses = Responses.find({ questionId: question._id, attempt: attemptNumber }, { sort: { createdAt: -1 } }).fetch()
  // const responses = Responses.find({ questionId: props.question._id }, { sort: { createdAt: -1 } }).fetch()

  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _ShortAnswerList)

ShortAnswerList.propTypes = {
  question: PropTypes.object.isRequired
}
