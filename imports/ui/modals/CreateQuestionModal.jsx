// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateQuestionModal.jsx: popup dialog to prompt for question details

import React, { Component, PropTypes } from 'react'
import { ControlledForm } from '../ControlledForm'
import { QuestionEditItem } from '../QuestionEditItem'

export class CreateQuestionModal extends ControlledForm {

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
      <div className='ql-modal ql-modal-createquestion ql-card' onClick={this.preventPropagation}>
        <div className='ql-modal-header ql-header-bar'><h2>Add a Question</h2></div>
        <div className='ql-card-content'>
          <div id='ckeditor-toolbar' />
          <QuestionEditItem
            ref='editItem'
            question={this.props.question}
            courseId={this.props.courseId}
            tags />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.props.done}>Cancel</a>
            <button className='btn btn-default' onClick={this.saveAndClose}>Submit Question</button>
          </div>
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
