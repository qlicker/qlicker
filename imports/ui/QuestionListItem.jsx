/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { PropTypes, Component } from 'react'

import { ListItem } from './ListItem'

const noop = () => {}

export class QuestionListItem extends Component {

  constructor (props) {
    super(props)

    if (this.props.question) {
      const qid = this.props.question._id

      const stopClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
      }

      this.click = this.props.click ? (e) => {
        stopClick(e)
        this.props.click(qid)
      } : noop

      this.remove = this.props.remove ? (e) => {
        stopClick(e)
        this.props.remove(qid)
      } : noop

      this.delete = this.props.delete ? (e) => {
        stopClick(e)
        this.props.delete(qid)
      } : noop
    }
  }

  render () {
    // const navigateToSession = () => { Router.go('session', { _id: this.props.session._id }) }
    const q = this.props.question || { question: 'Question?', type: 0 }
    const tags = q.tags || []
    return (
      <div className={(this.props.click ? 'cursor-pointer' : '') + ' ql-question-list-item'}
        onClick={this.click} >
        <span className='ql-question-name'>{q.plainText || <span className='new-question-placeholder'>New Question</span> }</span>
        {/* <span className='ql-question-status'>{QUESTION_TYPE_STRINGS[q.type]} </span> */}
        <div className='ql-label-list'>
          {
            tags.map((t) => {
              return <span className='label label-info'>{t.label}</span>
            })
          }
        </div>
        <div className='controls'>
          { this.props.remove
            ? <button className='btn btn-default' onClick={this.remove}>Remove</button>
            : ''}
          { this.props.delete
            ? <button className='btn btn-default' onClick={this.delete}>Delete</button>
            : ''}
        </div>
      </div>)
  } //  end render

}

QuestionListItem.propTypes = {
  question: PropTypes.object,
  click: PropTypes.func,
  remove: PropTypes.func,
  delete: PropTypes.func
}

