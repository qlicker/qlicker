/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentQuestionResultsListItem.jsx: List displaying student session results

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { WysiwygHelper } from '../wysiwyg-helpers'

import { Responses } from '../api/responses'
import { _ } from 'underscore'

export class _StudentQuestionResultsListItem extends Component {

  componentWillMount () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  render () {
    const q = this.props.question
    const unique = _.uniq(q.studentResponses, 'questionId')
    const attempts = 'Attempts: ' + unique.length + '/' + (q.sessionOptions ? q.sessionOptions.attempts.length : 0)
    return (<div className='ql-results-list-item ql-list-item'>
      <span className='title'>{WysiwygHelper.htmlDiv(q.content)}</span>
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

