// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateQuestionModal.jsx: popup dialog to prompt for course details

import React, { Component, PropTypes } from 'react'
import _ from 'underscore'

// draft-js
import { Editor } from 'react-draft-wysiwyg'
import { EditorState, convertFromHTML, ContentState } from 'draft-js'
import { DraftHelper } from '../../draft-helpers'

import { WithContext as ReactTags } from 'react-tag-input'

import { ControlledForm } from './ControlledForm'
import { QuestionImages } from '../../api/questions'

// constants
import { MC_ORDER, TF_ORDER, QUESTION_TYPE, EDITOR_OPTIONS }  from '../../configs'

// css
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

    // bindding methods for calling within react context
    this.onEditorStateChange = this.onEditorStateChange.bind(this)
    this.uploadImageCallBack = this.uploadImageCallBack.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
    this.setAnswerState = this.setAnswerState.bind(this)
    this.markCorrect = this.markCorrect.bind(this)
    this.deleteTag = this.deleteTag.bind(this)
    this.addTag = this.addTag.bind(this)
    this.handleDrag = this.handleDrag.bind(this)
    this.changeType = this.changeType.bind(this)

    // if editing pre-exsiting question
    if (this.props.question) {
      this.state = _.extend({}, this.props.question)

      this.state.content = DraftHelper.toEditorState(this.state.content)

      this.state.answers.forEach((a) => {
        if (a.wysiwyg) a.content = DraftHelper.toEditorState(a.content)
      })

    } else { // if adding new question
      this.state = _.extend({}, DEFAULT_STATE)

      // bold placehodler text for question editor
      const initialQuestionState = ContentState.createFromBlockArray(convertFromHTML('<h2>&nbsp; ?</h2>').contentBlocks)
      this.state.content = EditorState.createWithContent(initialQuestionState)
    }
    // set draft-js editor toolbar options
    this.options = _.extend({}, EDITOR_OPTIONS)

    // tracking for adding new mulitple choice answers
    this.currentAnswer = 0
    this.answerOrder = _.extend({}, MC_ORDER)

    // populate tagging suggestions
    this.tagSuggestions = []
    Meteor.call('questions.possibleTags', (e, tags) => {
      // non-critical, if e: silently fail
      this.tagSuggestions = tags
      this.forceUpdate()
    })
  } // end constructor

  /**
   * changeType (Event: e)
   * change question type to MC, TF or SA
   */
  changeType (e) {
    let type = parseInt(e.target.value)

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
   * deleteTag (Int: i)
   * remove tag from state
   */
  deleteTag (i) {
      let tags = this.state.tags
      tags.splice(i, 1)
      this.setState({ tags: tags })
  }

  /**
   * addTag (String: tag)
   * add tag to state
   */
  addTag (tag) {
      let tags = this.state.tags
      tags.push({
          id: tags.length + 1,
          text: tag
      })
      this.setState({ tags: tags })
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

    // _(this.state.tags.length + 1).times((i) => {
    //   this.deleteTag(i-1)
    // })
    // console.log('should be empty', this.state.tags)

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
    const serialized = DraftHelper.toJson(question.content)
    question.content = serialized.json
    question.question = serialized.plainText

    question.answers = []
    this.state.answers.forEach((a) => {
      let copy = _.extend({}, a)
      if (copy.wysiwyg) copy.content = DraftHelper.toJson(copy.content).json
      question.answers.push(copy)
    })

    question.tags = []
    this.state.tags.forEach((t) => {
      question.tags.push(_.extend({}, t))
    })

    Meteor.call('questions.insert', question, (error) => {
      if (error) {
        alertify.error('Error: ' + error.error)
      } else {
        alertify.success( !question._id ? 'Question Added' : 'Edits Saved')
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
    // create new draft-js editor with slimmed down confif
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
    
    // create wrapped draft-js editor based on answer object
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

      return (<div className='col-md-6 small-editor-wrapper' key={'answer_' + a.answer}>
        { !a.wysiwyg ? noWysiwygAnswer : wysiwygAnswer }
      </div>)
    }

    // generate rows with up to 2 editors on each row
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

    return (<div className='ql-modal-container' onClick={this.done}>
          <div className='ql-modal ql-modal-createquestion container' onClick={this.preventPropagation}>
            <div className='ql-modal-header'>
              <h2>{ !this.state._id ? 'Add a Question' : 'Edit Question' }</h2>
              <select defaultValue={this.state.type} onChange={this.changeType} className='ql-header-button question-type form-control'>
                <option value={ QUESTION_TYPE.MC }>Multiple Choice</option>
                <option value={ QUESTION_TYPE.TF }>True / False</option>
                <option value={ QUESTION_TYPE.SA }>Short Answer</option>
              </select>
              { this.state.type === QUESTION_TYPE.MC ? 
                <button className='ql-header-button btn btn-default' onClick={this.addAnswer}>Add Answer</button> 
                : '' }

            </div>

            <form ref='questionForm' className='ql-form-question' onSubmit={this.handleSubmit}>
              <div className="row">
                <div className="col-md-8">{ newEditor(this.state.content, this.onEditorStateChange) }</div>
                <div className="col-md-4">
                  <h3>Tags</h3>
                    <ReactTags ref='tagInput' tags={this.state.tags}
                      suggestions={this.tagSuggestions}
                      handleDelete={this.deleteTag}
                      handleAddition={this.addTag}
                      handleDrag={this.handleDrag} />
                </div>
              </div>
              
              { editorRows }

              <div className='ql-buttongroup'>
                <a className='btn btn-default' onClick={this.done}>Cancel</a>
                <input className='btn btn-default' type='submit' id='submit' />
              </div>
            </form>

          </div>
        </div>)
  } //  end render

} // end CreateQuestionModal

CreateQuestionModal.propTypes = {
  courseId: PropTypes.string.isRequired
}

