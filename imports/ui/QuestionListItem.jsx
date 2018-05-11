/* global confirm  */
/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionListItem.jsx: React component list item for each course

import React, { PropTypes } from 'react'

import { ListItem } from './ListItem'

import HTMLEllipsis from 'react-lines-ellipsis/lib/html'

import { Courses } from '../api/courses'

/**
 * React component list item for each question.
 * typically used in session screens.
 * @augments ListItem
 * @prop {Question} question - question object
 * @prop {Func} [click] - list item click handler
 */
export class QuestionListItem extends ListItem {

  componentWillMount () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  componentWillUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  render () {
    const s = this.props.session
    const c = Courses.findOne({ _id: this.props.question.courseId })
    const controls = this.makeControls()
    if(c !== undefined) console.log(c.name)
    // const navigateToSession = () => { Router.go('session', { _id: this.props.session._id }) }
    const q = this.props.question || { question: 'Question?', type: 0 }
    // console.log(s.questions.indexOf(q._id) !== -1 ? q.content : '')
    const isCurrent = s && s.status === 'running' && (s.currentQuestion === q._id)
    const truncated = q.plainText ? <HTMLEllipsis unsafeHTML={q.content} maxLine='3' basedOn='words' /> : ''
    const content = q.plainText ? <span className={isCurrent ? 'current-question-list-item' : ''}>
      {s && s.questions.indexOf(q._id) !== -1 ? (s.questions.indexOf(q._id) + 1) + '. ' : ''}{truncated}
    </span> : ''
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
        <div>
          <span className='ql-question-details'>
            {this.props.question.public ? '(public) ' : ''}
            {this.props.question.courseId && c !== undefined ? '('+ c.deptCode.toUpperCase() + ' ' + c.courseNumber + ') ' : ''}
            {this.props.question.approved ? '(approved) ' : '(un-approved) '}
          </span>
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
