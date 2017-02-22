// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionEditItem.jsx: component for editing/create used in session creation

import React, { PropTypes } from 'react'
import _ from 'underscore'

import ReactRadioButtonGroup from 'react-radio-button-group'

import { WithContext as ReactTags } from 'react-tag-input'

import { ControlledForm } from './ControlledForm'
import { Editor } from './Editor'
import { RadioPrompt } from './RadioPrompt'
import { QuestionImages } from '../api/questions'

// constants
import { MC_ORDER, TF_ORDER, QUESTION_TYPE, QUESTION_TYPE_STRINGS, EDITOR_OPTIONS } from '../configs'

export const DEFAULT_STATE = {
  question: '',
  type: -1, // QUESTION_TYPE.MC, QUESTION_TYPE.TF, QUESTION_TYPE.SA
  content: null,
  answers: [], // { correct: false, answer: 'A', content: editor content }
  submittedBy: '',
  createdAt: null,
  tags: []
}

export class QuestionEditItem extends ControlledForm {

  constructor (props) {
    super(props)

    // binding methods for calling within react context
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
    } else { // if adding new question
      this.state = _.extend({}, DEFAULT_STATE)
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
   * changeType (Number: newValue)
   * change question type to MC, TF or SA
   */
  changeType (newValue) {
    let type = parseInt(newValue)

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
      // TODO multi select
    })
  }

  /**
   * handleDrag (String: tag, Int: currPos, Int: newPos)
   * reorder tags
   */
  handleDrag (tag, currPos, newPos) {
    let tags = this.state.tags

      // mutate array
    tags.splice(currPos, 1)
    tags.splice(newPos, 0, tag)

      // re-render
    this.setState({ tags: tags })
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

  /**
   * addAnswer(Event _, Event e, Boolean wysiwyg, Callback done = null)
   * add answer to MC, MS, and TF questions
   */
  addAnswer (_, e, wysiwyg = true, done = null) {
    if (this.currentAnswer >= this.answerOrder.length) return
    this.setState({
      answers: this.state.answers.concat([{
        correct: this.currentAnswer === 0,
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

    if (Meteor.isTest) {
      this.props.done(question)
    }

    if (question.answers.length === 0 && question.type !== QUESTION_TYPE.SA) {
      alertify.error('Question needs at least one answer')
      return
    }

    // TODO set session id

    Meteor.call('questions.insert', question, (error) => {
      if (error) {
        alertify.error('Error: ' + error.error)
      } else {
        alertify.success(!question._id ? 'Question Added' : 'Edits Saved')
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
          if (err) {
            // handle error
            reject('hmm shit') // TODO
          } else {
            // handle success depending what you need to do
            setTimeout(function () {
              resolve({ data: { link: '/cfs/files/images/' + fileObj._id } })
            }, 500)
          }
        }) // .insert
      } // (resolve, reject)
    ) // promise
  } // end uploadImageCallBack

  componentWillReceiveProps (nextProps) {
    if (nextProps && nextProps.question) this.setState(nextProps.question)
  }

  render () {
    console.log(this.state)
    const answerEditor = (a) => {
      const changeHandler = (content) => {
        this.setAnswerState(a.answer, content)
      }

      const wysiwygAnswer = (
        <div>
          <span className='answer-option'>
            Option <span className='answer-key'>{ a.answer }</span>
            <span className='correct' onClick={() => this.markCorrect(a.answer)}>
              { a.correct
                ? <span className='correct-color'>Correct</span>
                : <span className='incorrect-color'>Incorrect</span> }
            </span>
          </span>
          <Editor
            change={changeHandler}
            val={a.content}
            className='answer-editor'
            />
        </div>)

      const noWysiwygAnswer = (<div className='answer-no-wysiwyg'>
        <span className={a.answer === 'TRUE' ? 'correct-color' : 'incorrect-color'}>{ a.answer }</span>
      </div>)

      return (<div className='col-md-6 small-editor-wrapper' key={'answer_' + a.answer}>
        { !a.wysiwyg ? noWysiwygAnswer : wysiwygAnswer }
      </div>)
    }

    // generate rows with up to 2 editors on each row
    let editorRows = []
    const len = this.state.answers.length
    for (let i = 0; i < len; i = i + 2) {
      let gaurunteed = this.state.answers[i]
      let possiblyUndefined = i < len ? this.state.answers[i + 1] : undefined

      editorRows.push(<div key={'row_' + i + '-' + i + 1} className='row'>
        { answerEditor(gaurunteed) }
        { possiblyUndefined ? answerEditor(possiblyUndefined) : '' }
      </div>)
    }

    const radioOptions = [
      { value: QUESTION_TYPE.MC, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.MC] },
      { value: QUESTION_TYPE.MS, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.MS] },
      { value: QUESTION_TYPE.TF, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.TF] },
      { value: QUESTION_TYPE.SA, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.SA] }
    ]

    return (
      <div className='ql-question-edit-item'>
        <div className='header'>

          <Editor
            change={this.onEditorStateChange}
            val={this.state.content}
            className='question-editor'
            placeholder='Question?' />

          <RadioPrompt
            options={radioOptions}
            value={this.state.type}
            onChange={this.changeType} />

        </div>

        { this.state.type === QUESTION_TYPE.MC || this.state.type === QUESTION_TYPE.MS
          ? <button className='btn btn-default' onClick={this.addAnswer}>Add Answer</button>
          : '' }

        {editorRows}
      </div>)
  } //  end render

} // end QuestionEditItem

QuestionEditItem.propTypes = {
  done: PropTypes.func
}
