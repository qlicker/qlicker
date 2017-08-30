/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionResultsListItem.jsx: Student list displaying answers

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { WysiwygHelper } from '../wysiwyg-helpers'

import { Responses } from '../api/responses'
import { _ } from 'underscore'

export class _QuestionResultsListItem extends Component {

  componentWillMount () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  render () {
    const q = this.props.question
    const total = this.props.session.joined ? this.props.session.joined.length : 0
    const unique = _.uniq(this.props.responses, 'studentUserId')
    return (<div className='ql-results-list-item ql-list-item'>
      <span>{(this.props.session.questions.indexOf(q._id) + 1) + '.'}</span>
      <span className='title'>{WysiwygHelper.htmlDiv(q.content)}</span>
      <span className='details'># Responses: { unique.length }/{ total }</span>
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

