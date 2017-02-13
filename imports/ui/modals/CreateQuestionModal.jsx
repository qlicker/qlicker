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
    this.markCorrect = this.markCorrect.bind(this)

    this.currentAnswer = 0

    this.state = _.extend({}, DEFAULT_STATE)
    this.options = _.extend({}, EDITOR_OPTIONS)
    // default to header style for question
    const initialQuestionState = ContentState.createFromBlockArray(convertFromHTML('<h2>New Question?</h2>').contentBlocks)
    this.state.content = EditorState.createWithContent(initialQuestionState)
  }

  /**
   * onEditorStateChange(Object: content)
   * Update wysiwyg contents for actual question in state
   */
  onEditorStateChange (content) {
    let stateEdits = { content: content }
    this.setState(stateEdits)
  }

  /**
   * setAnswerState(String: answerKey, Object: content)
   * Update wysiwyg content in the state based on the answer
   */
  setAnswerState (answerKey, content) {
    let answers = this.state.answers
    answers[_(answers).findIndex({ answer: answerKey })].content = content
    this.setState({
      answers: answers
    })
  } // end setAnswerState

  /**
   * markCorrect(String: answerKey)
   * Set answer as correct in stae
   */
  markCorrect (answerKey) {
    let answers = this.state.answers
    
    answers.forEach((a, i) => {
      if (a.answer === answerKey) answers[i].correct = true
      else answers[i].correct = false
    })

    this.setState({
      answers: answers
    })
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.questionForm.reset()
    this.setState(_.extend({}, DEFAULT_STATE))
    this.currentAnswer = 0
    super.done()
  }
  
  /**
   * handleSubmit(Event: e)
   * onSubmit handler for Question form. Calls questions.insert
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    let question = _.extend({}, this.state)

    if (Meteor.isTest) {
      this.props.done(question)
    }

    question.courseId = this.props.courseId

    // convert draft-js objects into JSON
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
        this.done()
      }
    })
  } // end handleSubmit

  addAnswer (e) {
    this.setState({ 
        answers: this.state.answers.concat([{ answer: ANSWER_ORDER[this.currentAnswer]}])
    })
    this.currentAnswer++
  } // end addAnswer


  /**
   * uploadImage(File: file)
   * Handle image uploaded through wysiwyg editor. Uploads images to QuestionImages GridFS store
   */
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
                toolbarClassName='home-toolbar'
                wrapperClassName='editor-wrapper'
                editorClassName='home-editor'
                toolbar={this.options}
                uploadCallback={this.uploadImageCallBack}
              />)
    }
    
    const answerEditor = (a) => {
        const editor = newEditor(a.content, (content) => {
          this.setAnswerState(a.answer, content)
        }, true)    
        return (
        <div className='six columns small-editor-wrapper' key={'answer_' + a.answer}>
          <span className='answer-option'>
            Option <span className='answer-key'>{ a.answer }</span>
            <span className='correct' onClick={() => this.markCorrect(a.answer) }>
              { a.correct ? 
                <span className='correct-color'>Correct</span> : 
                <span className='incorrect-color'>Incorrect</span> }
            </span>
          </span>
          { editor }
        </div>)
    }

    let editorRows = []
    const len = this.state.answers.length
    for (let i = 0; i < len; i=i+2) {
      let gaurunteed = this.state.answers[i]
      let possiblyUndefined = i < len ? this.state.answers[i+1] : undefined

      editorRows.push(<div className='row'>
        { answerEditor(gaurunteed) }
        { possiblyUndefined ? answerEditor(possiblyUndefined) : '' }
        </div>)
    }

    return (<div className='ui-modal-container' onClick={this.done}>
          <div className='ui-modal ui-modal-createquestion container' onClick={this.preventPropagation}>
            <h2>Add a Question</h2>
            <button onClick={this.addAnswer}>Add Answer</button>
            <form ref='questionForm' className='ui-form-question' onSubmit={this.handleSubmit}>
              { newEditor(this.state.content, this.onEditorStateChange) }
              { editorRows }
              <input type='submit' />
            </form>
          </div>
        </div>)
  } //  end render

} // end CreateQuestionModal

CreateQuestionModal.propTypes = {
  courseId: PropTypes.string.isRequired
}

