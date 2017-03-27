/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import $ from 'jquery'

import { createContainer } from 'meteor/react-meteor-data'
import DragSortableList from 'react-drag-sortable'
import { SingleDatePicker } from 'react-dates'
import moment from 'moment'
import { Creatable } from 'react-select'

import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'

import { QuestionSidebar } from '../../QuestionSidebar'
import { QuestionListItem } from '../../QuestionListItem'
import { QuestionEditItem } from '../../QuestionEditItem'

class _ManageSession extends Component {

  constructor (props) {
    super(props)

    this.state = {
      editing: false,
      session: _.extend({}, this.props.session),
      questionPool: 'library'
    }

    this.sessionId = this.props.sessionId
    
    this.addTag = this.addTag.bind(this)
    this.setDate = this.setDate.bind(this)
    this.setValue = this.setValue.bind(this)
    this.addToSession = this.addToSession.bind(this)
    this.removeQuestion = this.removeQuestion.bind(this)
    this.duplicateQuestion = this.duplicateQuestion.bind(this)
    this.onSortQuestions = this.onSortQuestions.bind(this)
    this.addNewQuestion = this.addNewQuestion.bind(this)
    this.newQuestionSaved = this.newQuestionSaved.bind(this)
    this.changeQuestionPool = this.changeQuestionPool.bind(this)
    this.runSession = this.runSession.bind(this)
    this._DB_saveSessionEdits = _.debounce(this.saveSessionEdits, 800)
  }

  runSession () {
    const sessionEdits = this.state.session
    sessionEdits.status = 'running'
    this.setState({ session: sessionEdits }, () => {
      this.saveSessionEdits(() => {
        Router.go('session.run', { _id: this.state.session._id })
      })
    })
  }

  /**
   * addTag (String: tag)
   * add tag to session state
   */
  addTag (tags) {
    const sessionEdits = this.state.session
    sessionEdits.tags = tags
    sessionEdits.tags.forEach((t) => {
      t.label = t.label.toUpperCase()
      t.value = t.value.toUpperCase()
    })
    this.setState({ session: sessionEdits }, () => {
      this._DB_saveSessionEdits()
    })
  }

  /**
   * removeQuestion(MongoId (string): questionId)
   * calls sessions.removeQuestion to remove from session
   */
  removeQuestion (questionId) {
    Meteor.call('sessions.removeQuestion', this.sessionId, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Removed')
    })
  }

  /**
   * duplicateQuestion(MongoId (string): questionId)
   * creates a copy of the question and attached the new copy to the same session
   */
  duplicateQuestion (questionId) {
    Meteor.call('questions.copyToSession', this.sessionId, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Duplicate Added')
    })
  }

  /**
   * changeQuestionPool(Event: e)
   * select onchange handler for changing question list
   */
  changeQuestionPool (e) {
    this.setState({ questionPool: e.target.value })
  }

  /**
   * onSortQuestions([Sort Object (ref <DragSortableList/>)]: sorted)
   * handler for drag and drop sorter, calls sessions.batchEdit
   */
  onSortQuestions (sorted) {
    const questionIdList = _(sorted).pluck('id')

    const session = this.state.session
    session.questions = questionIdList
    this.setState({ session: session })

    Meteor.call('sessions.batchEdit', this.sessionId, questionIdList, (e) => {
      if (e) alertify.error('An error occured while reordering questions')
      else alertify.success('Order Saved')
    })
  }

  setDate (date) {
    let stateEdits = this.state.session
    stateEdits.date = date ? date.toDate() : null
    this.setState({ session: stateEdits }, () => {
      this._DB_saveSessionEdits()
    })
  }

  /**
   * setValue(Input Event: e)
   * generate method to handle set state stuff
   */
  setValue (e) {
    let stateEdits = this.state.session
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState({ session: stateEdits }, () => {
      this._DB_saveSessionEdits()
    })
  }

  /**
   * addNewQuestion()
   * add a blank question edit item to create a new question
   */
  addNewQuestion () {
    if (this.state.session.questions) {
      this.state.session.questions.push(-1)
    } else this.state.session.questions = [-1]
    this.forceUpdate()
  }

  /**
   * newQuestionSaved(MongoId (string): questionId)
   * swap out temporary '-1' placeholder in question list with new questionId
   */
  newQuestionSaved (questionId) {
    this.state.session.questions.splice(this.state.session.questions.indexOf(-1), 1)
    Meteor.call('sessions.addQuestion', this.state.session._id, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Added')
    })
  }

  /**
   * addToSession(MongoId (String) questionId)
   * handler for question sidebar. Calls questions.copyToSession
   */
  addToSession (questionId) {
    if (!questionId) {
      alertify.error('Please select a question to add')
      return
    }

    Meteor.call('questions.copyToSession', this.state.session._id, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Added')
    })
  }

  /**
   * saveSessionEdits()
   * save current session state to db
   */
  saveSessionEdits (optCallback) {
    Meteor.call('sessions.edit', this.state.session, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Session details saved')
        if (optCallback) optCallback()
      }
    })
  }

  cursorMoveWorkaround () {
    // workaround for https://github.com/taye/interact.js/issues/497
    setTimeout(() => {
      $('html').removeAttr('style')
    }, 500)
  }

  /**
   * componentWillReceiveProps(Props (Object) nP)
   * update state from props
   */
  componentWillReceiveProps (nP) {
    if (!nP) return
    if (nP.session) this.setState({ session: nP.session })
  }

  /**
   * componentDidMount(nextProps)
   * enable bootstrap tabs
   */
  componentDidMount () {
    $('#sidebar-tabs a').click(function (e) {
      e.preventDefault()
      $(this).tab('show')
    })
  }

  render () {
    if (this.props.loading) return <div>Loading</div>

    let questionList = this.state.session.questions || []
    const qlItems = []
    questionList.forEach((questionId) => {
      const q = this.props.questions[questionId]
      qlItems.push({
        content: <QuestionListItem
          click={this.cursorMoveWorkaround}
          question={q}
          controls={[
            { label: 'Remove', click: () => this.removeQuestion(questionId) },
            { label: 'Duplicate', click: () => this.duplicateQuestion(questionId) }
          ]} />,
        id: questionId
      })
    })

    const getQuestionPool = () => {
      if (this.state.questionPool === 'student') return this.props.questionFromStudents
      if (this.state.questionPool === 'public') return this.props.questionPublic
      return this.props.questionLibrary
    }

    return (
      <div className='ql-manage-session'>
        <div className='ql-session-toolbar'>
          <span className='run-button' onClick={this.runSession}>
            <span className='glyphicon glyphicon-play' />&nbsp;
            Run Session
          </span>
          <span className='divider'>&nbsp;</span>
          <select className='form-control status-select' data-name='status' onChange={this.setValue} defaultValue={this.state.session.status}>
            <option value='hidden'>Draft (Hidden)</option>
            <option value='visible'>Visible</option>
            <option value='running'>Active</option>
            <option value='done'>Done</option>
          </select>
          <span className='divider'>&nbsp;</span>
          <SingleDatePicker
            date={this.state.session.date ? moment(this.state.session.date) : null}
            onDateChange={this.setDate}
            focused={this.state.focused}
            numberOfMonths={1}
            showClearDate
            onFocusChange={({ focused }) => this.setState({ focused })} />
          <span className='divider'>&nbsp;</span>
          <div id='ckeditor-toolbar' />
        </div>
        <div className='ql-row-container'>
          <div className='ql-sidebar-container'>
            <div className='ql-session-sidebar'>
              <ul className='nav nav-tabs' id='sidebar-tabs' role='tablist'>
                <li role='presentation' className='active'><a href='#session' aria-controls='session' role='tab' data-toggle='tab'>Session</a></li>
                <li role='presentation'><a href='#questions' aria-controls='questions' role='tab' data-toggle='tab'>Question Library</a></li>
              </ul>
              <div className='tab-content'>
                <div role='tabpanel' className='tab-pane active' id='session'>
                  <h3>Question Order</h3>
                  <div className='ql-session-question-list'>
                    {<DragSortableList items={qlItems} onSort={this.onSortQuestions} />}
                  </div>
                </div>
                <div role='tabpanel' className='tab-pane' id='questions'>
                  <h3>Search and Filtering</h3>
                  <select className='form-control' onChange={this.changeQuestionPool}>
                    <option value='library'>My Question Library</option>
                    <option value='public'>Public Question Pool</option>
                    <option value='student'>Submitted by Students</option>
                  </select>
                  <QuestionSidebar
                    session={this.state.session}
                    questions={getQuestionPool()}
                    onSelect={this.addToSession}
                    clickMessage='Click on question to add to session' />
                </div>
              </div>
            </div>
          </div>
          <div className='ql-main-content' >

            <div className='ql-session-child-container session-details-container'>
              <input type='text' className='ql-header-text-input' value={this.state.session.name} data-name='name' onChange={this.setValue} />
              <div className='row'>
                <div className='col-md-6 left-column'>
                  <textarea className='form-control session-description' data-name='description'
                    onChange={this.setValue}
                    rows={1}
                    placeholder='Session Description'
                    value={this.state.session.description} />
                </div>
                <div className='col-md-6 right-column'>
                  <div className='session-tags'>
                    <Creatable
                      name='tag-input'
                      placeholder='Session Tags'
                      multi
                      value={this.state.session.tags}
                      onChange={this.addTag}
                  />
                  {/*options={this.tagSuggestions}*/}
                  </div>
                </div>
              </div>

            </div>
            {
              questionList.map((questionId) => {
                const q = questionId === -1 ? null : this.props.questions[questionId]

                return (<div key={'question-' + questionId} className='ql-session-child-container'>
                  <QuestionEditItem
                    question={q}
                    sessionId={this.state.session._id}
                    onNewQuestion={this.newQuestionSaved}
                    autoSave />
                </div>)
              })
            }
            <div className='ql-session-child-container new-question-item' onClick={this.addNewQuestion}>
              <span>New Question <span className='glyphicon glyphicon-plus' /></span>
            </div>

          </div>
        </div>
      </div>)
  }

}

export const ManageSession = createContainer((props) => {
  const handle = Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inSession', props.sessionId) &&
    Meteor.subscribe('questions.library') &&
    Meteor.subscribe('questions.public') &&
    Meteor.subscribe('questions.fromStudent')
  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

  return {
    questions: _.indexBy(questionsInSession, '_id'),
    questionLibrary: Questions.find({ submittedBy: Meteor.userId(), sessionId: {$exists: false} }).fetch(),
    questionPublic: Questions.find({ public: true, courseId: {$exists: false} }).fetch(),
    questionFromStudents: Questions.find({ courseId: session.courseId, sessionId: {$exists: false}, public: true }).fetch(),
    session: session,
    loading: !handle.ready()
  }
}, _ManageSession)

