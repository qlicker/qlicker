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
  content: undefined,
  answers: [], // { answer: "A", content: editor content }
  submittedBy: '',
  tags: []
}
export const options = {
  options: ['inline', 'fontSize', 'blockType', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'image'],
  list: { inDropdown: true, options:['unordered', 'ordered'] },
  fontFamily: { options: ['Open Sans', 'Arial', 'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana', 'Courier New'] },
  textAlign: { inDropdown: true },
  inline: { inDropdown: true },
  blockType: { inDropdown: true, options: ['Normal', 'H1', 'H2', 'H3'] },
  link: { options: ['link'] }, image: { uploadCallback: this.uploadImageCallBack }
}
export const ANSWER_ORDER = ['A', 'B', 'C', 'D', 'E', 'F']


export class CreateQuestionModal extends Component {

  constructor (props) {
    super(props)

    this.state = _.extend({}, DEFAULT_STATE)
    this.currentAnswer = 0

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onEditorStateChange = this.onEditorStateChange.bind(this)
    this.uploadImageCallBack = this.uploadImageCallBack.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
    this.setAnswerState = this.setAnswerState.bind(this)
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  onEditorStateChange (e) {
    let stateEdits = { editorContent: e }
    this.setState(stateEdits)
  }

  setAnswerState (answerKey, editorContent) {
    let answers = this.state.answers
    answers[_(answers).findIndex({ answer: answerKey })].editorContent = editorContent
    this.setState({
      answers: answers
    })
  }

  handleSubmit (e) {
    e.preventDefault()

    let question = _.extend({
      createdAt: new Date()
    }, this.state)

    if (Meteor.isTest) {
      this.props.done(question)
    }

    // question.question = question.content.getPlainText()
    question.content = JSON.stringify(question.editorContent)
    question.editorContent = undefined

    question.answers.map((a) => {
      a.content = JSON.stringify(a.editorContent)
      a.editorContent = undefined
    })


    Meteor.call('questions.insert', question, (error) => {
      if (error) {
        console.log(error)
        if (error.error === 'not-authorized') {
          // TODO
        } else if (error.error === 400) {
          // check didnt pass
        }
      } else {
        // Reset
        this.refs.questionForm.reset()
        this.setState(_.extend({}, DEFAULT_STATE))
        this.currentAnswer = 0
        this.props.done()
      }
    })

  }

  addAnswer (e) {
    this.setState({ 
        answers: this.state.answers.concat([{ answer: ANSWER_ORDER[this.currentAnswer]}])
    })
    this.currentAnswer++
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
          <h2>New Question</h2>
          { newEditor(this.state.editorContent, this.onEditorStateChange) }

          { 
            this.state.answers.map((a) => {
              const editor = newEditor(a.editorContent, (editorContent) => {
                this.setAnswerState(a.answer, editorContent)
              })
              return (<div key={'answer_' + a.answer}><h2>{ a.answer }</h2> { editor } </div>)
            }) 
          }

          <input type='submit' />

        </form>
      </div>)
  } //  end render

} // end CreateQuestionModal
