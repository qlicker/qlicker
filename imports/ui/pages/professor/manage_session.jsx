/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_session.jsx: page for managing a specific session

import React, { Component } from 'react'

import _ from 'underscore'

import { createContainer } from 'meteor/react-meteor-data'
import { SingleDatePicker } from 'react-dates'
import moment from 'moment'
import { Creatable } from 'react-select'
import 'react-select/dist/react-select.css'

import { Sessions } from '../../../api/sessions'
import { Courses } from '../../../api/courses'

import { QuestionSidebar } from '../../QuestionSidebar'
import { QuestionEditItem } from '../../QuestionEditItem'
import { QuestionDragSortList } from '../../QuestionDragSortList'

import { SESSION_STATUS_STRINGS } from '../../../configs'
import $ from 'jquery'
import { defaultQuestion } from '../../../api/questions'

class _ManageSession extends Component {

  constructor (props) {
    super(props)

    this.state = {
      editing: false,
      session: this.props.session,
      questionPool: Meteor.user().isInstructorAnyCourse() ? 'library' : 'public',
      limit: 11,
      query: {query: {}, options: {}},
      tab: 'questionOrder'
    }

    this.sessionId = this.props.sessionId

    this.addTag = this.addTag.bind(this)
    this.setDate = this.setDate.bind(this)
    this.toggleQuizMode = this.toggleQuizMode.bind(this)
    this.checkReview = this.checkReview.bind(this)
    this.setValue = this.setValue.bind(this)
    this.addToSession = this.addToSession.bind(this)
    this.onSortQuestions = this.onSortQuestions.bind(this)
    this.getQuestions = this.getQuestions.bind(this)
    this.addNewQuestion = this.addNewQuestion.bind(this)
    this.removeQuestion = this.removeQuestion.bind(this)
    this.addToLibrary = this.addToLibrary.bind(this)
    this.addAllToLibrary = this.addAllToLibrary.bind(this)
    this.newQuestionSaved = this.newQuestionSaved.bind(this)
    this.changeQuestionPool = this.changeQuestionPool.bind(this)
    this.runSession = this.runSession.bind(this)
    this._DB_saveSessionEdits = _.debounce(this.saveSessionEdits, 800)

    // populate tagging suggestions
    this.tagSuggestions = []
    Meteor.call('sessions.possibleTags', (e, tags) => {
      // non-critical, if e: silently fail
      tags.forEach((t) => {
        this.tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      //this.forceUpdate()
    })
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

  // starts the session if there are questions
  runSession () {
    const sessionEdits = this.state.session
    if (typeof sessionEdits.questions !== 'undefined' && sessionEdits.questions.length > 0) {
      let prevStatus = sessionEdits.status
      sessionEdits.status = 'running'
      this.setDate(moment())
      this.setState({ session: sessionEdits }, () => {
        this.saveSessionEdits(() => {
          Router.go('session.run', { _id: this.state.session._id, courseId: this.state.session.courseId })
          if (prevStatus !== 'running') {
            Meteor.call('questions.startAttempt', this.state.session.currentQuestion)
            if (!this.state.session.quiz) {
              Meteor.call('questions.hideQuestion', this.state.session.currentQuestion)
            }
          }
        })
      })
    }
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
   * addToLibrary(MongoId (string): questionId)
   * adds the question to the library
   */
  addToLibrary (questionId) {
    Meteor.call('questions.copyToLibrary', questionId, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Copied to Library')
    })
  }

  addAllToLibrary (questionList) {
    questionList.forEach((questionId) => {
      this.addToLibrary(questionId)
    })
  }

  /**
   * changeQuestionPool(Event: e)
   * select onchange handler for changing question list
   */
  changeQuestionPool (e) {
    this.setState({ questionPool: e.target.value, limit: 11 })
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

  toggleQuizMode () {
    Meteor.call('sessions.toggleQuizMode', this.sessionId, (e) => {
      if (e) alertify.error('Could not toggle quiz mode')
      else alertify.success('Quiz mode changed')
    })
  }

  /**
   * checkReview(Input Event: e)
   * method to hide a session from review
   */
  checkReview (e) {
    const status = e.target.value
    let stateEdits = this.state.session
    if (status === 'hidden' || status === 'visible') {
      stateEdits[e.target.dataset.name] = e.target.value
      stateEdits['reviewable'] = false
      this.setState({ session: stateEdits }, () => {
        this._DB_saveSessionEdits()
      })
    } else this.setValue(e)
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

  getQuestions (questions) {
    this.setState({ questions: questions })
  }

  /**
   * addNewQuestion()
   * add a blank question edit item to create a new question
   */
  addNewQuestion () {
    const sessionId = this.state.session._id
    let tags = []
    const course = Courses.findOne(this.state.session.courseId)
    const code = course.courseCode().toUpperCase()
    const semester = course.semester.toUpperCase()
    tags.push({ value: code, label: code })
    tags.push({ value: semester, label: semester })

    const blankQuestion = _.extend( defaultQuestion, {
      sessionId: sessionId,
      courseId: this.state.session.courseId,
      owner: Meteor.userId(), // Owner is either TA or Professor since students cannot manage session
      creator: Meteor.userId(),
      approved: true,
    })

    Meteor.call('questions.insert', blankQuestion, (e, newQuestion) => {
      if (e) return alertify.error('Error: couldn\'t add new question')
      alertify.success('New Blank Question Added')
      Meteor.call('sessions.addQuestion', sessionId, newQuestion._id)

      $('#ql-main-content').stop().animate({
        scrollTop: $('#ql-main-content')[0].scrollHeight
      }, 800)
    })
  }

  /**
   * removeQuestion(MongoId (string): questionId)
   * calls sessions.removeQuestion to remove from session
   */
  removeQuestion (questionId) {

    Meteor.call('sessions.removeQuestion', this.props.session._id, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Removed')
    })
    this.props.cursorMoveWorkaround()
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
  addToSession (question) {
    if (!question) {
      alertify.error('Please select a question to add')
      return
    }


    Meteor.call('questions.copyToSession', this.state.session._id, question._id, (error) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Added')

      $('#ql-main-content').stop().animate({
        scrollTop: $('#ql-main-content')[0].scrollHeight
      }, 800)
    })
  }

  /**
   * saveSessionEdits()
   * save current session state to db
   */
  saveSessionEdits (optCallback) {
    if (!this.state.session.name) return alertify.error('Please enter a session name')
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



  render () {

    const setTab = (e) => { this.setState({ tab: e })}
    let questionList = this.state.session.questions || []
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    return (
      <div className='ql-manage-session'>
        <div className='ql-session-toolbar'>
          <h3 className='session-title'>Session Editor</h3>
          <span className='divider'>&nbsp;</span>
          <span className='toolbar-button' onClick={this.runSession}>
            <span className='glyphicon glyphicon-play' />&nbsp;
            {this.state.session.status === 'running' ? 'Continue Session' : 'Run Session'}
          </span>
          <span className='divider'>&nbsp;</span>
          <span className='toolbar-button' onClick={() => this.addAllToLibrary(questionList)}>
            Copy All Questions to Library
          </span>
          <span className='divider'>&nbsp;</span>
          <select className='ql-unstyled-select form-control status-select' data-name='status' onChange={this.checkReview} defaultValue={this.state.session.status}>
            <option value='hidden'>{SESSION_STATUS_STRINGS['hidden']}</option>
            <option value='visible'>{SESSION_STATUS_STRINGS['visible']}</option>
            <option value='running'>{SESSION_STATUS_STRINGS['running']}</option>
            <option value='done'>{SESSION_STATUS_STRINGS['done']}</option>
          </select>
          <span className='divider'>&nbsp;</span>
          <SingleDatePicker
            date={this.state.session.date ? moment(this.state.session.date) : null}
            onDateChange={this.setDate}
            focused={this.state.focused}
            numberOfMonths={1}
            showClearDate
            isOutsideRange={() => false}
            onFocusChange={({ focused }) => this.setState({ focused })} />
          <span className='divider'>&nbsp;</span>
          <div id='ckeditor-toolbar' />
        </div>
        <div className='ql-row-container'>
          <div className='ql-sidebar-container'>
            <div className='ql-session-sidebar'>
              <ul className='nav nav-tabs' id='sidebar-tabs' role='tablist'>
                <li role='presentation' className='active'><a href='#session' aria-controls='session' data-toggle='tab' onClick={() => setTab('questionOrder')}>Question Order</a></li>
                <li role='presentation'><a href='#questions' aria-controls='questions' data-toggle='tab' onClick={() => setTab('questionLibrary')}>Question Library</a></li>
              </ul>
              <div className='tab-content'>
                <div className='tab-pane active' id='session'>
                  <div className='ql-session-question-list reorder'>
                  { this.state.tab === 'questionOrder'
                    ? <QuestionDragSortList
                        session={this.state.session}
                        onSortQuestions={this.onSortQuestions}
                        cursorMoveWorkaround={this.cursorMoveWorkaround}
                        addToLibrary={this.addToLibrary}
                        getQuestions={this.getQuestions}
                        />
                    : ''
                  }
                    <div className='new-question-item' onClick={this.addNewQuestion}>
                      <span>New Question <span className='glyphicon glyphicon-plus' /></span>
                    </div>
                  </div>
                </div>
                <div className='tab-pane' id='questions'>
                  <select className='form-control' onChange={this.changeQuestionPool}>
                    { Meteor.user().isInstructor(this.props.session.courseId)
                      ? <option value='library'>My Question Library</option> : ''}
                    <option value='public'>Public Question Pool</option>
                    { !this.props.course.requireApprovedPublicQuestions
                      ? <option value='unapprovedFromStudents'>Submitted by Students</option> : '' }
                  </select>
                  { this.state.tab === 'questionLibrary'
                    ? <QuestionSidebar
                        questionLibrary={this.state.questionPool}
                        session={this.state.session}
                        courseId={this.props.session.courseId}
                        onSelect={this.addToSession}
                        clickMessage='Click on question to copy to session'
                        handle={this.props.handle} />
                    : ''
                  }
                </div>
              </div>
            </div>
          </div>
          <div className='ql-main-content' id='ql-main-content'>

            <div className='ql-session-child-container session-details-container'>
              <input type='text' className='ql-header-text-input' value={this.state.session.name} data-name='name' onChange={this.setValue} />
              <div className='ql-session-details-checkbox'>
                <input type='checkbox' checked={this.props.session.quiz} data-name='quiz' onChange={this.toggleQuizMode} /> Quiz (all questions shown at once)<br />
              </div>
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
                      options={this.tagSuggestions}
                      value={this.state.session.tags}
                      onChange={this.addTag}
                  />
                  </div>
                </div>
              </div>
            </div>
            { this.state.questions
            ? questionList.map((questionId) => {
                const q = questionId === -1 ? null : this.state.questions[questionId]

                const questionNumber = this.props.session.questions.indexOf(questionId) + 1
                return (<div key={'question-' + questionId} className='ql-session-child-container'>
                  <QuestionEditItem
                    onDeleteThis={() => this.removeQuestion(questionId)}
                    question={q}
                    questionNumber={questionNumber}
                    sessionId={this.state.session._id}
                    courseId={this.state.session.courseId}
                    onNewQuestion={this.newQuestionSaved}
                    isQuiz={this.state.session.quiz}
                    autoSave />
                </div>)
              })
            : ''
            }
            <div className='ql-session-child-container new-question-item' onClick={this.addNewQuestion}>
              <span>New Question <span className='glyphicon glyphicon-plus' /></span>
            </div>

          </div>
        </div>
        {
          this.state.session.status === 'done'
          ? <div className='read-only-cover'>
            <div className='message'>
              Session has finished. To make edits, please set the status to Draft (or Upcoming). Qlicker recommends that you avoid editing sessions that students have submitted responses to.
            </div>
          </div>
          : ''
        }
      </div>)
  }

}

export const ManageSession = createContainer((props) => {
  const handle = Meteor.subscribe('sessions', {isInstructor: props.isInstructor})

  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
  const course = Courses.findOne({ _id: session.courseId})

  return {
    session: session,
    course: course,
    loading: !handle.ready()
  }
}, _ManageSession)
