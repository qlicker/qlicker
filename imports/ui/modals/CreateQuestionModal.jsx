// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateQuestionModal.jsx: popup dialog to prompt for course details

import React, { Component } from 'react'
import _ from 'underscore'


import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
if (Meteor.isClient) import './CreateQuestionModal.scss'


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
    this.uploadImageCallBack = this.uploadImageCallBack.bind(this)
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

  uploadImageCallBack () {

    return new Promise(
      (resolve, reject) => {
        resolve({ data: { link: "http://placehold.it/300/300" } });
      }
    )

  }

  render () {

    return (
      <div className='ui-modal ui-modal-createquestion'>
        <form ref='questionForm' className='ui-form-question' onSubmit={this.handleSubmit}>
          <Editor
            editorState={this.state.content}
            onEditorStateChange={this.onEditorStateChange}
            toolbarClassName="home-toolbar"
            wrapperClassName="editor-wrapper"
            editorClassName="home-editor"
            toolbar={{ options: ['inline', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'image'], list: { inDropdown: true, options:['unordered', 'ordered'] }, fontFamily: { options: ['Arial', 'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana', 'Courier New'] } , textAlign: { inDropdown: true }, inline: { inDropdown: true }, link: { options: ['link'] }, image: { uploadCallback: this.uploadImageCallBack }}} />
        </form>
      </div>)
  } //  end render

} // end CreateQuestionModal
