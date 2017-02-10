// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateQuestionModal.jsx: popup dialog to prompt for course details

import React, { Component, PropTypes } from 'react'
import _ from 'underscore'

import { Editor } from 'react-draft-wysiwyg'
import { convertFromRaw, convertToRaw, EditorState, convertFromHTML, ContentState } from 'draft-js'

import { ANSWER_ORDER, EDITOR_OPTIONS }  from '../../configs'
import { ControlledForm } from './ControlledForm'

import { QuestionImages } from '../../api/questions'

if (Meteor.isClient) { 
  import './CreateQuestionModal.scss'
  import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
}

export const DEFAULT_STATE = {
  question: '',
  content: null,
  answers: [], // { answer: "A", content: editor content }
  submittedBy: '',
  createdAt: null,
  courseId: null,
  tags: []
}

export class CreateQuestionModal extends ControlledForm {

  constructor (props) {
    super(props)

    this.onEditorStateChange = this.onEditorStateChange.bind(this)
    this.uploadImageCallBack = this.uploadImageCallBack.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
    this.setAnswerState = this.setAnswerState.bind(this)

    this.currentAnswer = 0

    this.state = _.extend({}, DEFAULT_STATE)
    this.options = _.extend({}, EDITOR_OPTIONS)
    // default to header style for question
    const initialQuestionState = ContentState.createFromBlockArray(convertFromHTML('<h1>New Question</h1>').contentBlocks)
    this.state.content = EditorState.createWithContent(initialQuestionState)
  }

  onEditorStateChange (e) {
    let stateEdits = { content: e }
    this.setState(stateEdits)
  }

  setAnswerState (answerKey, content) {
    let answers = this.state.answers
    answers[_(answers).findIndex({ answer: answerKey })].content = content
    this.setState({
      answers: answers
    })
  } // end setAnswerState

  handleSubmit (e) {
    super.handleSubmit(e)

    let question = _.extend({}, this.state)

    if (Meteor.isTest) {
      this.props.done(question)
    }

    question.courseId = this.props.courseId

    const contentState = question.content.getCurrentContent()
    question.content = JSON.stringify(convertToRaw(contentState))
    question.question = contentState.getPlainText()

    question.answers.forEach((a) => {
      const contentState = a.content.getCurrentContent()
      a.content = JSON.stringify(convertToRaw(contentState))
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
  } // end handleSubmit

  addAnswer (e) {
    this.setState({ 
        answers: this.state.answers.concat([{ answer: ANSWER_ORDER[this.currentAnswer]}])
    })
    this.currentAnswer++
  } // end addAnswer

  uploadImageCallBack (file) {
    console.log(file)
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
                toolbarClassName='home-toolbar'
                wrapperClassName='editor-wrapper'
                editorClassName='home-editor'
                toolbar={this.options}
                uploadCallback={this.uploadImageCallBack}
              />)
    }

    return (
      <div className='ui-modal ui-modal-createquestion'>
        <button onClick={this.addAnswer}>Add Answer</button>
        <form ref='questionForm' className='ui-form-question' onSubmit={this.handleSubmit}>
          { newEditor(this.state.content, this.onEditorStateChange) }

          { 
            this.state.answers.map((a) => {
              const editor = newEditor(a.content, (content) => {
                this.setAnswerState(a.answer, content)
              }, true)
              return (<div className='small-editor-wrapper' key={'answer_' + a.answer}><h2 className='answer-option'>{ a.answer }</h2> { editor } </div>)
            }) 
          }
          <div className='u-cf'></div>
          <input type='submit' />
        </form>
      </div>)
  } //  end render

} // end CreateQuestionModal

CreateQuestionModal.propTypes = {
  courseId: PropTypes.string.isRequired
}

