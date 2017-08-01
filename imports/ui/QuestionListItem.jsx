/* global confirm  */
/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionListItem.jsx: React component list item for each course

import React, { PropTypes } from 'react'

import { ListItem } from './ListItem'
import { WysiwygHelper } from '../wysiwyg-helpers'

import LinesEllipsis from 'react-lines-ellipsis'


/**
 * React component list item for each question.
 * typically used in session screens.
 * @augments ListItem
 * @prop {Question} question - question object
 * @prop {Func} [click] - list item click handler
 */
export class QuestionListItem extends ListItem {

  componentDidUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  render () {
    const s = this.props.session
    const controls = this.makeControls()
    // const navigateToSession = () => { Router.go('session', { _id: this.props.session._id }) }
    const q = this.props.question || { question: 'Question?', type: 0 }
    const isCurrent = s && s.status === 'running' && (s.currentQuestion === q._id)
    const truncated = WysiwygHelper.htmlDiv(q.content) // <LinesEllipsis text={''} maxLine='3' trimRight basedOn='words' />
    const content = <div className={isCurrent ? 'current-question-list-item' : ''}>{truncated}</div>
    const tags = q.tags || []
    return (
      <div className={(this.props.click ? 'cursor-pointer' : '') + ' ql-question-list-item ql-list-item'}
        onClick={this.click} >
        <span className='ql-question-name'>{content || <span className='new-question-placeholder'>New Question</span> }</span>
        { this.props.details ? <span className='ql-question-details'>{this.props.details}</span> : '' }
        <div className='ql-label-list'>
          {
            tags.map((t) => {
              return <span key={t.value} className='ql-label ql-label-info'>{t.label}</span>
            })
          }
        </div>
        <div className='controls'>{controls}</div>
      </div>)
  } //  end render

}

QuestionListItem.propTypes = {
  question: PropTypes.object,
  session: PropTypes.object,
  click: PropTypes.func
}

