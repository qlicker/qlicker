// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionEditItem.jsx: component for editing/create used in session creation

import React, { PropTypes, Component } from 'react'
import _ from 'underscore'
import $ from 'jquery'

import { Creatable } from 'react-select'

import { Editor } from './Editor'
import { RadioPrompt } from './RadioPrompt'
import { QuestionImages } from '../api/questions'

// constants
import { MC_ORDER, TF_ORDER, QUESTION_TYPE, QUESTION_TYPE_STRINGS } from '../configs'

export const DEFAULT_STATE = {
  plainText: '',
  type: -1, // QUESTION_TYPE.MC, QUESTION_TYPE.TF, QUESTION_TYPE.SA
  content: null,
  options: [], // { correct: false, answer: 'A', content: editor content }
  submittedBy: '',
  tags: []
}

export class QuestionEditItem extends Component {

  constructor (props) {
    super(props)

    // binding methods for calling within react context
    this.onEditorStateChange = this.onEditorStateChange.bind(this)
    this.uploadImageCallBack = this.uploadImageCallBack.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
    this.setOptionState = this.setOptionState.bind(this)
    this.markCorrect = this.markCorrect.bind(this)
    this.addTag = this.addTag.bind(this)
    this.changeType = this.changeType.bind(this)
    this.saveQuestion = this.saveQuestion.bind(this)
    this.togglePublic = this.togglePublic.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this._DB_saveQuestion = _.debounce(() => { if (this.props.autoSave) this.saveQuestion() }, 1800)

    // if editing pre-exsiting question
    if (this.props.question) {
      this.state = _.extend({}, this.props.question)

      this.currentAnswer = this.state.options ? this.state.options.length : 0
      switch (this.state.type) {
        case QUESTION_TYPE.MC:
          this.answerOrder = MC_ORDER
          break
        case QUESTION_TYPE.MS:
          this.answerOrder = MC_ORDER
          break
        case QUESTION_TYPE.TF:
          this.answerOrder = TF_ORDER
          break
      }
    } else { // if adding new question
      this.state = _.extend({}, DEFAULT_STATE)
      this.state.submittedBy = Meteor.userId()
      // tracking for adding new mulitple choice answers
      this.currentAnswer = 0
      this.answerOrder = MC_ORDER
    }

    // populate tagging suggestions
    this.tagSuggestions = []
    Meteor.call('questions.possibleTags', (e, tags) => {
      // non-critical, if e: silently fail
      tags.forEach((t) => {
        this.tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      this.forceUpdate()
    })

    if (this.props.courseId) {
      // add course code tag
      Meteor.call('courses.getCourseCodeTag', this.props.courseId, (e, tag) => {
        if (this.state.tags) this.state.tags.push(tag)
        else this.state.tags = [tag]
      })
    }
  } // end constructor

  /**
   * changeType (Number: newValue)
   * change question type to MC, TF or SA
   */
  changeType (newValue) {
    let type = parseInt(newValue)

    this.setState({ type: type, options: [] }, () => {
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
      this._DB_saveQuestion()
      // TODO multi select
    })
  }

  /**
   * addTag (String: tag)
   * add tag to state
   */
  addTag (tags) {
    this.setState({ tags: tags }, () => {
      this._DB_saveQuestion()
    })
  }

  /**
   * onEditorStateChange(Object: content)
   * Update wysiwyg contents for actual question in state
   */
  onEditorStateChange (content, plainText) {
    let stateEdits = { content: content, plainText: plainText }
    this.setState(stateEdits, () => {
      this._DB_saveQuestion()
    })
  }

  /**
   * setOptionState(String: answerKey, Object: content)
   * Update wysiwyg content in the state based on the answer
   */
  setOptionState (answerKey, content, plainText) {
    let options = this.state.options
    const i = _(options).findIndex({ answer: answerKey })
    options[i].content = content
    options[i].plainText = plainText
    this.setState({ options: options }, () => {
      this._DB_saveQuestion()
    })
  } // end setOptionState

  /**
   * addAnswer(Event _, Event e, Boolean wysiwyg, Callback done = null)
   * add answer to MC, MS, and TF questions
   */
  addAnswer (_, e, wysiwyg = true, done = null) {
    const answerKey = this.answerOrder[this.currentAnswer]
    if (this.currentAnswer >= this.answerOrder.length) return
    this.setState({
      options: this.state.options.concat([{
        correct: this.currentAnswer === 0,
        answer: answerKey,
        wysiwyg: wysiwyg
      }])
    }, () => {
      this.currentAnswer++

      if (wysiwyg) this.setOptionState(answerKey, '', '')
      else this.setOptionState(answerKey, answerKey, answerKey)

      if (done) done()
    })
  } // end addAnswer

  /**
   * markCorrect(String: answerKey)
   * Set answer as correct in stae
   */
  markCorrect (answerKey) {
    let options = this.state.options

    if (this.state.type === QUESTION_TYPE.MS) {
      options.forEach((a, i) => {
        if (a.answer === answerKey) options[i].correct = !options[i].correct
      })
    } else {
      options.forEach((a, i) => {
        if (a.answer === answerKey) options[i].correct = true
        else options[i].correct = false
      })
    }

    this.setState({ options: options }, () => {
      this._DB_saveQuestion()
    })
  }

  togglePublic () {
    this.setState({ public: !this.state.public }, () => {
      this.saveQuestion()
    })
  }

  /**
   * saveQuestion ()
   * Calls questions.insert to save question to db
   */
  saveQuestion () {
    let question = _.extend({ createdAt: new Date() }, this.state)

    if (question.options.length === 0 && question.type !== QUESTION_TYPE.SA) return

    if (this.props.sessionId) question.sessionId = this.props.sessionId
    if (this.props.courseId) question.courseId = this.props.courseId

    // insert (or edit)
    Meteor.call('questions.insert', question, (error, newQuestion) => {
      if (error) {
        alertify.error('Error: ' + error.error)
      } else {
        if (!this.state._id) {
          alertify.success('Question Saved')
          if (this.props.onNewQuestion) this.props.onNewQuestion(newQuestion._id)
        } else {
          alertify.success('Edits Saved')
        }
        this.setState(newQuestion)
      }
    })
  } // end saveQuestion

  deleteQuestion () {
    Meteor.call('questions.delete', this.state._id, (error) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Deleted')
      if (this.props.deleted) this.props.deleted()
    })
  }

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
            reject('hmm shit') // TODO
          } else {
            setTimeout(function () {
              resolve({ data: { link: '/cfs/files/images/' + fileObj._id } })
            }, 500)
          }
        }) // .insert
      } // (resolve, reject)
    )
  } // end uploadImageCallBack

  componentWillReceiveProps (nextProps) {
    this.setState(nextProps.question)
  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    $('[data-toggle="tooltip"]').tooltip()
  }

  render () {
    const answerEditor = (a) => {
      const changeHandler = (content, plainText) => {
        this.setOptionState(a.answer, content, plainText)
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
    const len = this.state.options ? this.state.options.length : 0
    for (let i = 0; i < len; i = i + 2) {
      let gaurunteed = this.state.options[i]
      let possiblyUndefined = i < len ? this.state.options[i + 1] : undefined

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

    const strMakePublic = this.state.public ? 'Make Private' : 'Make Public'
    return (
      <div className='ql-question-edit-item'>
        <div className='header'>
          { this.props.metadata
            ? <div className='row'>
              <div className='col-md-6'>
                <div className='btn-group'>
                  <button className='btn btn-default'
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Create a copy of this question'>
                    Duplicate
                  </button>
                  <button
                    className='btn btn-default'
                    onClick={this.deleteQuestion}>
                    Delete
                  </button>
                  <button
                    className='btn btn-default'
                    onClick={this.togglePublic}
                    data-toggle='tooltip'
                    data-placement='top'
                    title={!this.state.public ? 'Allow others to view and copy this question' : ''}>
                    {strMakePublic}
                  </button>
                </div>
              </div>
              <div className='col-md-6'>
                <Creatable
                  name='tag-input'
                  placeholder='Question Tags'
                  multi
                  value={this.state.tags}
                  options={this.tagSuggestions}
                  onChange={this.addTag}
                  />
              </div>
            </div>
            : '' }
          <div className='row'>
            <div className='col-md-12'>
              <Editor
                change={this.onEditorStateChange}
                val={this.state.content}
                className='question-editor'
                placeholder='Question?' />
            </div>
          </div>
        </div>

        <RadioPrompt
          options={radioOptions}
          value={this.state.type}
          onChange={this.changeType} />

        {editorRows}

        { this.state.type === QUESTION_TYPE.MC || this.state.type === QUESTION_TYPE.MS
          ? <button className='btn btn-default' onClick={this.addAnswer}>Add Answer</button>
          : '' }

      </div>)
  } //  end render

} // end QuestionEditItem

QuestionEditItem.propTypes = {
  done: PropTypes.func,
  question: PropTypes.object,
  onNewQuestion: PropTypes.func,
  metadata: PropTypes.bool,
  deleted: PropTypes.func,
  autoSave: PropTypes.bool
}
