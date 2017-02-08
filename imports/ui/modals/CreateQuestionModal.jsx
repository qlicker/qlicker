// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateQuestionModal.jsx: popup dialog to prompt for course details

import React, { Component } from 'react'
import _ from 'underscore'


import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
// if (Meteor.isClient) import './CreateCourseModal.scss'

export const DEFAULT_STATE = {
  question: '',
  content: '',
  submittedBy: '',
  tags: ''
}

export class CreateQuestionModal extends Component {

  constructor (props) {
    super(props)

    this.state = _.extend({}, DEFAULT_STATE)

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onEditorStateChange = this.onEditorStateChange.bind(this)
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  onEditorStateChange (e) {
    let stateEdits = { content: e }
    this.setState(stateEdits)
  }

  handleSubmit (e) {
    e.preventDefault()

    let question = _.extend({
      createdAt: new Date(),
      courseId: this.props.courseId
    }, this.state)

    if (Meteor.isTest) {
      this.props.done(question)
    }


  }

  render () {

    const uploadImageCallBack = () => {

      return new Promise(
        (resolve, reject) => {
          resolve({ data: { link: "http://placehold.it/300/300" } });
        }
      )

    }

    return (
      <div className='ui-modal ui-modal-createquestion'>
        <form ref='questionForm' className='ui-form-question' onSubmit={this.handleSubmit}>
          <Editor
            editorState={this.state.content}
            onEditorStateChange={this.onEditorStateChange}
            toolbarClassName="home-toolbar"
            wrapperClassName="home-wrapper"
            editorClassName="home-editor"
            toolbar={{ image: { uploadCallback: uploadImageCallBack }}} />
        </form>
      </div>)
  } //  end render

} // end CreateQuestionModal
