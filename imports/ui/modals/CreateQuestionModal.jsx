// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateQuestionModal.jsx: popup dialog to prompt for course details

import React, { Component } from 'react'
import _ from 'underscore'

import { QuestionImages } from '../../api/questions'

import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
if (Meteor.isClient) import './CreateQuestionModal.scss'

export const DEFAULT_STATE = {
  question: '',
  content: '',
  answers: [], // { display: "A", content: editor content }
  submittedBy: '',
  tags: ''
}
export const options = {
  options: ['inline', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'image'],
  list: { inDropdown: true, options:['unordered', 'ordered'] },
  fontFamily: { options: ['Arial', 'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana', 'Courier New'] },
  textAlign: { inDropdown: true }, inline: { inDropdown: true },
  link: { options: ['link'] }, image: { uploadCallback: this.uploadImageCallBack }
}

export class CreateQuestionModal extends Component {

  constructor (props) {
    super(props)

    this.state = _.extend({}, DEFAULT_STATE)

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onEditorStateChange = this.onEditorStateChange.bind(this)
    this.uploadImageCallBack = this.uploadImageCallBack.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
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

  addAnswer (e) {
    let stateEdits = { answers: [ { display: 'A', content: '' } ] }
    this.setState(stateEdits)
  }

  uploadImageCallBack (file) {
    return new Promise(
      (resolve, reject) => {
        QuestionImages.insert(file, function (err, fileObj) {
          console.log(err, fileObj)
          if (err){
            // handle error
            reject("hmm shit") // TODO
          } else {
            // handle success depending what you need to do
            setTimeout(function() {
              resolve({ data: { link: '/cfs/files/images/' + fileObj._id } })
            }, 500)
          }
        }) // .insert
      } // (resolve, reject)
    ) // promise
  } // end uploadImageCallBack

  render () {
    const newEditor = (state, callback) => {
      return (<Editor
            editorState={state}
            onEditorStateChange={callback}
            toolbarClassName="home-toolbar"
            wrapperClassName="editor-wrapper"
            editorClassName="home-editor"
            toolbar={options} />)
    }

    return (
      <div className='ui-modal ui-modal-createquestion'>
        <button onClick={this.addAnswer}>Add Answer</button>
        <form ref='questionForm' className='ui-form-question' onSubmit={this.handleSubmit}>
          { newEditor(this.state.content, this.onEditorStateChange) }

          { 
            this.state.answers.map(function (a) {
              return newEditor(a.content, (e) => {
                a.content = e
              })
            }) 
          }

        </form>
      </div>)
  } //  end render

} // end CreateQuestionModal
