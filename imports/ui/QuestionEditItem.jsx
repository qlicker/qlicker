// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionEditItem.jsx: component for editing/create used in session creation

import React, { PropTypes, Component } from 'react'
import _ from 'underscore'
import $ from 'jquery'

import  Select, { Creatable } from 'react-select'
//The Select component has to be imported without {}
//https://github.com/JedWatson/react-select/issues/741
//import Select from 'react-select'

import { Editor } from './Editor'
import { RadioPrompt } from './RadioPrompt'
import { QuestionImages } from '../api/questions'

// constants
import { MC_ORDER, TF_ORDER, SA_ORDER, QUESTION_TYPE, QUESTION_TYPE_STRINGS } from '../configs'

export const DEFAULT_STATE = {
  plainText: '',
  type: -1, // QUESTION_TYPE.MC, QUESTION_TYPE.TF, QUESTION_TYPE.SA
  content: null,
  options: [], // { correct: false, answer: 'A', content: editor content }
  creator: '',
  tags: [],
  sessionOptions: {
    hidden: false,
    stats: false,
    correct: false,
    attempts: [{
      number: 1,
      closed: false
    }]
  }

}

/**
 * React Component for editing an individual question
 * @prop {Question} question - question object
 * @prop {Func} [onNewQuestion] - callback when a new question is save to database
 * @prop {Boolean} [metadata] - wether element should display top metadata (tags, make public buttons) row
 * @prop {Func} [deleted] - callback when delete button pressed
 * @prop {Boolean} [autoSave] - should component save change automatically
 */
export class QuestionEditItem extends Component {

  constructor (props) {
    super(props)

    // binding methods for calling within react context
    this.onEditorStateChange = this.onEditorStateChange.bind(this)
    // this.uploadImageCallBack = this.uploadImageCallBack.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
    this.setOptionState = this.setOptionState.bind(this)
    this.markCorrect = this.markCorrect.bind(this)
    this.addTag = this.addTag.bind(this)
    this.addTagString = this.addTagString.bind(this)
    this.changeType = this.changeType.bind(this)
    this.saveQuestion = this.saveQuestion.bind(this)
    this.togglePublic = this.togglePublic.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.setCourse = this.setCourse.bind(this)
    this._DB_saveQuestion = _.debounce(() => { if (this.props.autoSave) this.saveQuestion() }, 1600)

    // if editing pre-exsiting question
    if (this.props.question) {
      this.state = _.extend({}, this.props.question)
      this.state.owner = Meteor.userId()

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
        case QUESTION_TYPE.SA:
          this.answerOrder = SA_ORDER
          break
      }
    } else { // if adding new question
      this.state = _.extend({}, DEFAULT_STATE)
      this.state.creator = Meteor.userId()
      this.state.owner = Meteor.userId()
      // tracking for adding new mulitple choice answers
      this.currentAnswer = 0
      this.answerOrder = MC_ORDER
    }

    // populate tagging suggestions
    this.tagSuggestions = []
    user = Meteor.user()
    if( user.hasRole('student') && this.props.courseId && !user.isInstructorAnyCourse() ){
      Meteor.call('questions.possibleTags',this.props.courseId, (e, tags) => {
        // non-critical, if e: silently fail
        tags.forEach((t) => {
          this.tagSuggestions.push({ value: t, label: t.toUpperCase() })
        })
        this.forceUpdate()
      })
    }else{
      Meteor.call('questions.possibleTags', (e, tags) => {
        // non-critical, if e: silently fail
        tags.forEach((t) => {
          this.tagSuggestions.push({ value: t, label: t.toUpperCase() })
        })
        this.forceUpdate()
      })

    }


    if (this.props.courseId) {
      // add course code tag
      Meteor.call('courses.getCourseCodeTag', this.props.courseId, (e, tag) => {
        if(tag) this.setState({ tags: [tag] })
      })
    }

    //if (!this.props.courseId && !this.props.question.courseId) {
    if(user.isInstructorAnyCourse()){
      Meteor.call('courses.getCourseTags', (e, d) => {
        this.setState({courses: d})
      })
    }
  } // end constructor

  /**
   * change question type to MC, TF or SA
   * @param {Number} newValue
   */
  changeType (newValue) {
    let type = parseInt(newValue)
    const oldType = this.state.type
    const retainOptions = (oldType === QUESTION_TYPE.MC && type === QUESTION_TYPE.MS) ||
      (type === QUESTION_TYPE.MC && oldType === QUESTION_TYPE.MS)

    const stateUpdater = { type: type }
    if (!retainOptions) {
      if (oldType === QUESTION_TYPE.SA || oldType === QUESTION_TYPE.TF) {
        stateUpdater.options = []
      } else if (this.state.options && this.state.options.length > 0) {
        if (this.state.options.length === 1 && this.state.options[0].content === '') {
          stateUpdater.options = []
        } else {
          const c = confirm('You are about to clear your answer options for this question. Do you want to proceed?')
          if (c) stateUpdater.options = []
          else return
        }
      }
    } else {
      const options = this.state.options
      options.forEach((a, i) => {
        if (i === 0) options[i].correct = true
        else options[i].correct = false
      })
    }

    this.setState(stateUpdater, () => {
      if (type === QUESTION_TYPE.TF) {
        this.currentAnswer = 0
        this.answerOrder = _.extend({}, TF_ORDER)
        this.addAnswer(null, null, false, () => {
          this.addAnswer(null, null, false)
        })
      } else if (type === QUESTION_TYPE.SA) {
        this.currentAnswer = 0
        this.answerOrder = SA_ORDER
        this.addAnswer(null, null, true)
      } else if (!retainOptions) {
        this.currentAnswer = 0
        this.answerOrder = _.extend({}, MC_ORDER)
        this.addAnswer(null, null, true)
      }
      this._DB_saveQuestion()
    })
  }

  /**
   * save tags to the DB
   * @param {Array} tags
   */
  addTag (tags) {
    const _tags = tags
    _tags.forEach((t) => {
      t.label = t.label.toUpperCase()
      t.value = t.value.toUpperCase()
    })
    this.setState({ tags: _tags }, () => {
      this._DB_saveQuestion()
    })
  }

  /**
   * add tag to state
   * @param {String} tag
   */
  addTagString (tag) {
    const newTag = {label: tag,
      value: tag}
    let tags = this.state.tags
    tags.push(newTag)
    this.addTag(tags)
  }

  /**
   * Update wysiwyg contents for actual question in state
   * @param {Object} content
   */
  onEditorStateChange (content, plainText) {
    let stateEdits = { content: content, plainText: plainText }
    this.setState(stateEdits, () => {
      this._DB_saveQuestion()
    })
  }

  /**
   * Update wysiwyg content in the state based on the answer
   * @param {String} answerKey
   * @param {Object} content
   */
  setOptionState (answerKey, content, plainText) {
    let options = this.state.options
    const i = _(options).findIndex({ answer: answerKey })
    if (i >= 0) {
      options[i].content = content
      options[i].plainText = plainText
      this.setState({options: options}, () => {
        this._DB_saveQuestion()
      })
    }
  } // end setOptionState

  /**
   * add answer option to MC, MS, and TF questions
   * @param {Event} _ - form event
   * @param {Event} e - form event
   * @param {Boolean} [wysiwyg = true] - answer option has wysiwyg content
   * @param {Callback} [done = null] - callback when done
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
   * remove answer option to MC, MS, and TF questions
   * @param {String} answerKey
   */
  removeAnswer (answerKey) {
    if (this.state.options.length === 1) return
    const newOptions = []
    let resetCorrect = false

    this.currentAnswer--
    this.state.options.forEach(o => {
      if (answerKey !== o.answer) {
        const option = _.extend({}, o)
        newOptions.push(option)
      } else if (o.correct) { // delete option was marked as correct
        resetCorrect = true
      }
    })

    // reletter options
    newOptions.forEach((o, i) => {
      if (i === 0 && resetCorrect) o.correct = true
      o.answer = this.answerOrder[i]
    })

    this.setState({ options: [] }, () => {
      this.setState({ options: newOptions }, this._DB_saveQuestion)
    })
  } // end removeAnswer

  /**
   * Set answer as correct in stae
   * @param {String} answerKey
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
   * Calls {@link module:questions~"questions.insert" questions.insert} to save question to db
   */
  saveQuestion () {
    const user = Meteor.user()
    let question = _.extend({
      createdAt: new Date(),
      approved: user.hasGreaterRole('professor') || user.isInstructor(this.props.courseId)
    }, _.omit(this.state, 'courses'))
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

  componentWillReceiveProps (nextProps) {
    this.setState(nextProps.question)
  }

  setCourse (e) {
    if (e.target.value !== -1) {
      this.setState({courseId: e.target.value}, () => {
        this.saveQuestion()
      })
    }else{
      this.setState({courseId: null}, () => {
        this.saveQuestion()
      })
    }
  }

  /**
   * generate a answer option element row
   * @param {Answer} a
   */
  answerEditor (a) {
    if (!a) return <div>Loading</div>
    const changeHandler = (content, plainText) => {
      this.setOptionState(a.answer, content, plainText)
    }
    let item

    if (a.wysiwyg) {
      item = (
        <div>
          <div className='answer-option'>
            <span className='correct' onClick={() => this.markCorrect(a.answer)}>
              { a.correct ? <span className='glyphicon glyphicon-ok' /> : '' }
            </span>
            <span className='answer-key'>{ a.answer }</span>
            <Editor
              change={changeHandler}
              val={a.content}
              className='answer-editor'
              question={this.state}
              />

            <span
              onClick={() => this.removeAnswer(a.answer)}
              className='trash-icon glyphicon glyphicon-trash' />
          </div>
        </div>)
    } else {
      item = (<div className='answer-option'>
        <span className='correct' onClick={() => this.markCorrect(a.answer)}>
          { a.correct ? <span className='glyphicon glyphicon-ok' /> : '' }
        </span>
        <div className='answer-no-wysiwyg answer-editor'>
          <span>{ a.answer }</span>
        </div>
      </div>)
    }

    return (<div className={'small-editor-wrapper ' + (a.wysiwyg ? 'col-md-12' : 'col-md-6')} key={'answer_' + a.answer}>
      { item }
    </div>)
  } // end answerEditor

  shortAnswerEditor (a) {
    if (!a) return <div>Loading</div>
    const changeHandler = (content, plainText) => {
      this.setOptionState(a.answer, content, plainText)
    }

    return (<div className={'small-editor-wrapper col-md-12'} key={'answer_' + a.answer}>
      <div className='answer-option'>
        <Editor
          change={changeHandler}
          val={a.content}
          className='answer-editor'
          question={this.state}
        />
      </div>
    </div>)
  } // end shortAnswerEditor

  render () {
    let editorRows = []

    if (this.state.type === QUESTION_TYPE.TF) {
      const row = <div key='row_0' className='row'>
        {this.answerEditor(this.state.options[0])}
        {this.answerEditor(this.state.options[1])}
      </div>
      editorRows.push(row)
    } else if (this.state.type === QUESTION_TYPE.SA) {
      const row = this.state.options.forEach((option, i) => {
        editorRows.push(<div key={'row_' + i} className='row'>
          { this.shortAnswerEditor(option) }
        </div>)
      })
      editorRows.push(row)
    } else {
      this.state.options.forEach((option, i) => {
        editorRows.push(<div key={'row_' + i} className='row'>
          { this.answerEditor(option) }
        </div>)
      })
    }

    //Useed to decide which course to select by default in dropdown
    questionCourseId=-1
    if(this.props.courseId || this.props.question.courseId){
      if(this.props.courseId && this.props.question &&
         this.props.question.courseId&& this.props.courseId === this.props.question.courseId){
        questionCourseId = this.props.courseId
      }else if(this.props.question && this.props.question.courseId){
        questionCourseId = this.props.question.courseId
      }else if(this.props.courseId){
        questionCourseId = this.props.courseId
      }else{}
    }

    user = Meteor.user()
    //For some reason, using the Select component gives an error about courseTags and possibleTags???
    //Disable for now
    const selectOnly =  ( user.hasRole('student') && this.props.courseId && !user.isInstructorAnyCourse())

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
            ? <div className='row metadata-row'>
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
                <select value = {questionCourseId} className='ql-header-button question-type form-control pull-right' onChange={this.setCourse}>
                  <option key={-1} value={-1} >No course</option>
                  { this.state.courses
                   ? this.state.courses.map((obj) => {
                      return <option key={obj._id} value={obj._id} >{ obj.code }</option>
                     })
                   : ''
                  }
                </select>
              </div>

            </div>
            : '' }
          <div className='row'>
            <div className='col-md-12 metadata-row'>
            {selectOnly ? <Select
                  name='tag-input'
                  placeholder='Tags'
                  multi
                  value={this.state.tags ? this.state.tags : [''] }
                  options={this.tagSuggestions ? this.tagSuggestions : [{value:'',label:''}] }
                  onChange={this.addTag}
                /> : <Creatable
                  name='tag-input'
                  placeholder='Tags'
                  multi
                  value={this.state.tags}
                  options={this.tagSuggestions}
                  onChange={this.addTag}
                />
            }

            </div>
            <div className='col-md-12 question-row'>
              <Editor
                change={this.onEditorStateChange}
                val={this.state.content}
                className='question-editor'
                placeholder='Question?'
                question={this.state}/>
              { this.props.onDeleteThis
                ? <span
                  onClick={this.props.onDeleteThis}
                  className='trash-icon glyphicon glyphicon-trash' />
                  : '' }
            </div>
          </div>
        </div>

        <RadioPrompt
          options={radioOptions}
          value={this.state.type}
          onChange={this.changeType} />

        {editorRows}

        { this.state.type === QUESTION_TYPE.MC || this.state.type === QUESTION_TYPE.MS
          ? <div className='row' onClick={this.addAnswer}>
            <div className='col-md-12'>
              <div className='add-question-row-item'>
                New Option <span className='glyphicon glyphicon-plus' />
              </div>
            </div>
          </div>
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
