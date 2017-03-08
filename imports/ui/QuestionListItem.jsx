/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { Component, PropTypes } from 'react'

import { QUESTION_TYPE_STRINGS } from '../configs'
import { ListItem } from './ListItem'

export class QuestionListItem extends ListItem {


  render () {
    const controls = this.makeControls()
    // const navigateToSession = () => { Router.go('session', { _id: this.props.session._id }) }
    const q = this.props.question || { question: 'Question?', type: 0 }
    return (
      <div className={(this.props.click ? 'cursor-pointer' : '') + ' ql-question-list-item'}
        onClick={this.click} >
        <span className='ql-question-name'>{q.plainText || <span className='new-question-placeholder'>New Question</span> }</span>
        { this.props.details ? <span className='ql-question-details'>{this.props.details}</span> : '' }
        <div className='ql-label-list'>
          {
            q.tags.map((t) => {
              return <span className='label label-info'>{t.label}</span>
            })
          }
        </div>
        {controls}
      </div>)
  } //  end render

}

QuestionListItem.propTypes = {
  question: PropTypes.object,
  detailsKey: PropTypes.string
}

