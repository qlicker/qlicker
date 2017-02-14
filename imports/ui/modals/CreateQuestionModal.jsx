// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateQuestionModal.jsx: popup dialog to prompt for course details

import React, { Component, PropTypes } from 'react'
import _ from 'underscore'

import { Editor } from 'react-draft-wysiwyg'
import { convertFromRaw, convertToRaw, EditorState, convertFromHTML, ContentState } from 'draft-js'
import { WithContext as ReactTags } from 'react-tag-input'

import { MC_ORDER, TF_ORDER, QUESTION_TYPE, EDITOR_OPTIONS }  from '../../configs'
import { ControlledForm } from './ControlledForm'

import { QuestionImages } from '../../api/questions'

if (Meteor.isClient) { 
  import './CreateQuestionModal.scss'
  import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
  import 'react-tag-input/example/reactTags.css'
}

export const DEFAULT_STATE = {
  question: '',
  type: QUESTION_TYPE.MC, // QUESTION_TYPE.MC, QUESTION_TYPE.TF, QUESTION_TYPE.SA
  content: null,
  answers: [], // { correct: false, answer: 'A', content: editor content }
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
    this.handleDelete = this.handleDelete.bind(this)
    this.handleAddition = this.handleAddition.bind(this)
    this.handleDrag = this.handleDrag.bind(this)
    this.changeType = this.changeType.bind(this)

    this.currentAnswer = 0
    this.answerOrder = _.extend({}, MC_ORDER)

    this.state = _.extend({}, DEFAULT_STATE)
    this.options = _.extend({}, EDITOR_OPTIONS)
    // default to header style for question
    const initialQuestionState = ContentState.createFromBlockArray(convertFromHTML('<h2>&nbsp; ?</h2>').contentBlocks)
    this.state.content = EditorState.createWithContent(initialQuestionState)
  }

  /**
   * changeType (Event: e)
   * change question type to MC, TF or SA
   */
  changeType (e) {
    let type = QUESTION_TYPE[e.target.value]

    this.setState({ type: type, answers: [] }, () => {
      if (type === QUESTION_TYPE.MC) {
        this.currentAnswer = 0
        this.answerOrder = _.extend({}, MC_ORDER)
      } else if (type === QUESTION_TYPE.TF) {
        this.currentAnswer = 0
        this.answerOrder = _.extend({}, TF_ORDER)
        this.addAnswer(null, null, false, () => {
          this.addAnswer(null, null, false)
        })
      } else if (type === QUESTION_TYPE.SA) {
        this.currentAnswer = -1
        this.answerOrder = []
      }
    })
  }

  /**
   * handleDrag (String: tag, Int: currPos, Int: newPos)
   * reorder tags
   */
  handleDrag (tag, currPos, newPos) {
      let tags = this.state.tags;

      // mutate array
      tags.splice(currPos, 1);
      tags.splice(newPos, 0, tag);

      // re-render
      this.setState({ tags: tags });
  }

  /**
   * handleDelete (Int: i)
   * remove tag from state
   */
  handleDelete (i) {
      let tags = this.state.tags;
      tags.splice(i, 1);
      this.setState({tags: tags});
  }

  /**
   * handleAddition (String: tag)
   * add tag to state
   */
  handleAddition (tag) {
      let tags = this.state.tags;
      tags.push({
          id: tags.length + 1,
          text: tag
      });
      this.setState({tags: tags});
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

  addAnswer (_, e, wysiwyg=true, done=null) {
    if (this.currentAnswer >= this.answerOrder.length) return
    this.setState({
      answers: this.state.answers.concat([{ 
        correct: this.currentAnswer === 0 ? true : false, 
        answer: this.answerOrder[this.currentAnswer],
        wysiwyg: wysiwyg
      }])
    }, () => {
      this.currentAnswer++
      if (done) done()
    })
    
  } // end addAnswer

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
    question.courseId = this.props.courseId

    if (Meteor.isTest) {
      this.props.done(question)
    }

    if (question.answers.length === 0 && question.type !== QUESTION_TYPE.SA) {
      alertify.error('Question needs at least one answer')
      return
    }
    
    // convert draft-js objects into JSON
    const contentState = question.content.getCurrentContent()
    question.content = JSON.stringify(convertToRaw(contentState))
    question.question = contentState.getPlainText()

    question.answers.forEach((a) => {
      if (a.wysiwyg) {
        const contentState = a.content.getCurrentContent()
        a.content = JSON.stringify(convertToRaw(contentState))  
      }
    })

    Meteor.call('questions.insert', question, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Question Added')
        this.done()
      }
    })
  } // end handleSubmit

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
                uploadCallback={this.uploadImageCallBack} />)
    }
    
    const answerEditor = (a) => {
      const editor = newEditor(a.content, (content) => {
        this.setAnswerState(a.answer, content)
      }, true)

      const wysiwygAnswer = (
        <div>
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

      const noWysiwygAnswer = (<div className='answer-no-wysiwyg'>
          <span className={ a.answer === 'TRUE' ? 'correct-color' : 'incorrect-color' }>{ a.answer }</span>
        </div>)

      return (<div className='six columns small-editor-wrapper' key={'answer_' + a.answer}>
        { !a.wysiwyg ? noWysiwygAnswer : wysiwygAnswer }
      </div>)
    }

    let editorRows = []
    const len = this.state.answers.length
    for (let i = 0; i < len; i=i+2) {
      let gaurunteed = this.state.answers[i]
      let possiblyUndefined = i < len ? this.state.answers[i+1] : undefined

      editorRows.push(<div key={'row_'+i+'-'+i+1} className='row'>
        { answerEditor(gaurunteed) }
        { possiblyUndefined ? answerEditor(possiblyUndefined) : '' }
        </div>)
    }

    return (<div className='ui-modal-container' onClick={this.done}>
          <div className='ui-modal ui-modal-createquestion container' onClick={this.preventPropagation}>
            <div className='ui-modal-header'>
              <h2>Add a Question</h2>
              <select onChange={this.changeType} className='ui-header-button'>
                <option value='MC'>Multiple Choice</option>
                <option value='TF'>True / False</option>
                <option value='SA'>Short Answer</option>
              </select>
              { this.state.type === QUESTION_TYPE.MC ? <button className='ui-header-button' onClick={this.addAnswer}>Add Answer</button> : '' }
            </div>
            <form ref='questionForm' className='ui-form-question' onSubmit={this.handleSubmit}>
              <div className="row">
                <div className="columns eight">{ newEditor(this.state.content, this.onEditorStateChange) }</div>
                <div className="columns four">
                  <h3>Tags</h3>
                    <ReactTags tags={this.state.tags}
                      suggestions={['hello', 'wut']}
                      handleDelete={this.handleDelete}
                      handleAddition={this.handleAddition}
                      handleDrag={this.handleDrag} />
                </div>
              </div>
              { editorRows }
              <br/>
              <div className='ui-buttongroup'><a className ='button' onClick={this.done}>Cancel</a><input type='submit' id='submit'/></div>
            </form>
          </div>
        </div>)
  } //  end render

} // end CreateQuestionModal

CreateQuestionModal.propTypes = {
  courseId: PropTypes.string.isRequired
}

