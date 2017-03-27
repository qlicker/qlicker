// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateQuestionModal.jsx: popup dialog to prompt for question details

import React, { Component, PropTypes } from 'react'

import { QuestionEditItem } from '../QuestionEditItem'

export class CreateQuestionModal extends Component {

  constructor (p) {
    super(p)

    this.saveAndClose = this.saveAndClose.bind(this)
  }

  saveAndClose () {
    this.refs.editItem.saveQuestion()
    this.props.done()
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.props.done}>
      <div className='ql-modal ql-modal-createquestion container' onClick={this.preventPropagation}>
        <div className='ql-modal-header'><h2>Add a Question</h2></div>

        <QuestionEditItem
          ref='editItem'
          question={this.props.question}
          courseId={this.props.courseId}
          tags />

        <div className='ql-buttongroup'>
          <a className='btn btn-default' onClick={this.props.done}>Cancel</a>
          <button className='btn btn-primary' onClick={this.saveAndClose}>Submit Question</button>
        </div>
      </div>
    </div>)
  } //  end render

} // end CreateQuestionModal

CreateQuestionModal.propTypes = {
  done: PropTypes.func,
  question: PropTypes.object,
  courseId: PropTypes.string
}
