/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentQuestionResultsListItem.jsx: List displaying student session results

import React, { Component, PropTypes } from 'react'
import { WysiwygHelper } from '../wysiwyg-helpers'

export class StudentQuestionResultsListItem extends Component {
  componentWillMount () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }
  componentDidMount () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }
  componentDidUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  render () {
    const q = this.props.question
    const attempts = 'Attempts: ' + q.studentResponses.length + '/' + (q.sessionOptions && q.sessionOptions.attempts ? q.sessionOptions.attempts.length : 0)
    return (<div className='ql-results-list-item ql-list-item'>
      <span>{(this.props.session.questions.indexOf(q._id) + 1) + '.'}</span>
      <span className='title'>{WysiwygHelper.htmlDiv(q.content)}</span>
      {this.props.isPracticeSession
        ? ''
        : <span style={{float: 'right'}} className='title'>{attempts}</span>
      }
    </div>)
  } //  end render

}

StudentQuestionResultsListItem.propTypes = {
  question: PropTypes.object.isRequired,
  session: PropTypes.object.isRequired,
  isPracticeSession: PropTypes.bool
}
