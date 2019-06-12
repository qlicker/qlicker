/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ShortAnswerList.jsx

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Histogram } from './Histogram'
//import { WysiwygHelper } from '../wysiwyg-helpers'
import { Responses } from '../api/responses'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

/**
 * React component (meteor reactive) that displays a list of short answer reponses for a question
 * @prop {Question} question - question object
 */
class _HistogramNumerical extends Component {
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
  componentDidMount () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }
  componentDidUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }
  render () {
    if (this.props.loading) return <div>Loading</div>
    return (
      <div>
        <div className='ql-short-answer-list'>
          <h3>Responses</h3>
          {
            this.props.responses.map(r => <div key={r._id} className='ql-short-answer-item'>{this.renderAnswer(r)}</div>)
          }
        </div>
        <Histogram values={this.props.values} />
      </div>
    )
  } //  end render

}

export const HistogramNumerical = createContainer((props) => {

  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const question = props.question
  const attemptNumber = question.sessionOptions ? question.sessionOptions.attempts.length : 0
  // Get the responses for that attempt:
  const responses = Responses.find({ questionId: question._id, attempt: attemptNumber }, { sort: { createdAt: -1 } }).fetch()
  // Histogramming code:
  // Get the values into an array to be histogramed:
  const values = _(responses).pluck('answer').map(Number)
  return {
    values: values,
    loading: !handle.ready(),
    responses: responses
  }
}, _HistogramNumerical)

HistogramNumerical.propTypes = {
  question: PropTypes.object.isRequired
}
