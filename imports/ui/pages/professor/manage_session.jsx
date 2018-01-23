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
import 'react-select/dist/react-select.css'

import { Sessions } from '../../../api/sessions'
import { Questions, defaultSessionOptions } from '../../../api/questions'
import { Courses } from '../../../api/courses'

import { QuestionSidebar } from '../../QuestionSidebar'
import { QuestionListItem } from '../../QuestionListItem'
import { QuestionEditItem } from '../../QuestionEditItem'

import { SESSION_STATUS_STRINGS } from '../../../configs'

class _ManageSession extends Component {

  constructor (props) {
    super(props)

    this.state = {
      editing: false,
      session: _.extend({}, this.props.session),
      questionPool: Meteor.user().isInstructorAnyCourse() ? 'library' : 'public',
      limit: 11,
      query: {query: {}, options: {}}
    }

    this.sessionId = this.props.sessionId

    this.addTag = this.addTag.bind(this)
    this.setDate = this.setDate.bind(this)
    this.toggleQuizMode = this.toggleQuizMode.bind(this)
    this.checkReview = this.checkReview.bind(this)
    this.setValue = this.setValue.bind(this)
    this.addToSession = this.addToSession.bind(this)
    this.removeQuestion = this.removeQuestion.bind(this)
    this.duplicateQuestion = this.duplicateQuestion.bind(this)
    this.onSortQuestions = this.onSortQuestions.bind(this)
    this.addNewQuestion = this.addNewQuestion.bind(this)
    this.newQuestionSaved = this.newQuestionSaved.bind(this)
    this.changeQuestionPool = this.changeQuestionPool.bind(this)
    this.runSession = this.runSession.bind(this)
    this.updateQuery = this.updateQuery.bind(this)
    this._DB_saveSessionEdits = _.debounce(this.saveSessionEdits, 800)

    // populate tagging suggestions
    this.tagSuggestions = []
    Meteor.call('sessions.possibleTags', (e, tags) => {
      // non-critical, if e: silently fail
      tags.forEach((t) => {
        this.tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      this.forceUpdate()
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
          Router.go('session.run', { _id: this.state.session._id })
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
   * removeQuestion(MongoId (string): questionId)
   * calls sessions.removeQuestion to remove from session
   */
  removeQuestion (questionId) {
    Meteor.call('sessions.removeQuestion', this.sessionId, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Removed')
    })
    this.cursorMoveWorkaround()
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
    this.cursorMoveWorkaround()
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

    const blankQuestion = {
      plainText: '', // plain text version of question
      type: -1,
      content: '', // wysiwyg display content
      options: [],
      tags: tags,
      sessionId: sessionId,
      courseId: this.state.session.courseId,
      owner: course.owner,
      approved: true,
      sessionOptions: defaultSessionOptions
    }
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

  updateQuery (childState) {
    let params = this.state.query
    params.options.limit = this.state.limit
/*
    if (childState.questionType > -1) params.query.type = childState.questionType
    else params.query = _.omit(params.query, 'type')
    if (childState.searchString) params.query.plainText = {$regex: '.*' + childState.searchString + '.*', $options: 'i'}
    else params.query = _.omit(params.query, 'plainText')
    if (childState.tags.length) params.query['tags.value'] = { $all: _.pluck(childState.tags, 'value') }
    else params.query = _.omit(params.query, 'tags.value')
*/
    if (childState.questionType > -1) params.query.type = childState.questionType
    else params.query = _.omit(params.query, 'type')
    if (parseInt(childState.courseId) !== -1) params.query.courseId = childState.courseId
    else params.query = _.omit(params.query, 'courseId')
    if (childState.searchString) params.query.plainText = {$regex: '.*' + childState.searchString + '.*', $options: 'i'}
    else params.query = _.omit(params.query, 'plainText')
    if (childState.userSearchString) {
      const users = Meteor.users.find({ $or: [{'profile.lastname': {$regex: '.*' + childState.userSearchString + '.*', $options: 'i'}},
                                               {'profile.firstname': {$regex: '.*' + childState.userSearchString + '.*', $options: 'i'}}] }).fetch()
      const uids = _(users).pluck('_id')
      params.query.creator = {$in: uids}
    } else params.query = _.omit(params.query, 'creator')
    if (childState.tags.length) params.query['tags.value'] = { $all: _.pluck(childState.tags, 'value') }
    else params.query = _.omit(params.query, 'tags.value')

    this.setState({query: params})
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const increase = (childState) => {
      this.setState({limit: this.state.limit + 10}, () => this.updateQuery(childState))
    }
    const decrease = (childState) => {
      this.setState({limit: this.state.limit - 10}, () => this.updateQuery(childState))
    }

    let questionList = this.state.session.questions || []
    const qlItems = []
    questionList.forEach((questionId) => {
      const q = this.props.questions[questionId]
      qlItems.push({
        content: <QuestionListItem
          click={this.cursorMoveWorkaround}
          question={q}
          session={this.state.session}
          controlsTriggered={this.cursorMoveWorkaround}
          controls={[
            { label: 'Remove', click: () => this.removeQuestion(questionId) },
            { label: 'Duplicate', click: () => this.duplicateQuestion(questionId) },
            { label: 'Add to library', click: () => this.addToLibrary(questionId) }
          ]} />,
        id: questionId
      })
    })

    const getQuestionPool = () => {
      let query = {}
      let options = {}
      if (this.state.questionPool === 'student') {
        query = $.extend({}, this.props.studentParams.query, this.state.query.query)
        options = $.extend({}, this.props.studentParams.options, this.state.query.options)
      } else if (this.state.questionPool === 'public') {
        query = $.extend({}, this.props.publicParams.query, this.state.query.query)
        options = $.extend({}, this.props.publicParams.options, this.state.query.options)
      } else {
        query = $.extend({}, this.props.libraryParams.query, this.state.query.query)
        options = $.extend({}, this.props.libraryParams.options, this.state.query.options)
      }
      return Questions.find(query, options).fetch()
    }

    let library = getQuestionPool()

    const atMax = library.length !== this.state.limit
    if (!atMax) library = library.slice(0, -1)

    const sidebar = <QuestionSidebar
      session={this.state.session}
      questions={library}
      onSelect={this.addToSession}
      increase={increase}
      decrease={decrease}
      atMax={atMax}
      updateQuery={(data) => this.setState({limit: 11}, () => this.updateQuery(data))}
      clickMessage='Click on question to add to session' />

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
                <li role='presentation' className='active'><a href='#session' aria-controls='session' role='tab' data-toggle='tab'>Question Order</a></li>
                <li role='presentation'><a href='#questions' aria-controls='questions' role='tab' data-toggle='tab'>Question Library</a></li>
              </ul>
              <div className='tab-content'>
                <div role='tabpanel' className='tab-pane active' id='session'>
                  <div className='ql-session-question-list reorder'>
                    {<DragSortableList items={qlItems} onSort={this.onSortQuestions} />}
                    <div className='new-question-item' onClick={this.addNewQuestion}>
                      <span>New Question <span className='glyphicon glyphicon-plus' /></span>
                    </div>
                  </div>
                </div>
                <div role='tabpanel' className='tab-pane' id='questions'>
                  <select className='form-control' onChange={this.changeQuestionPool}>
                    { Meteor.user().isInstructor(this.props.session.courseId)
                      ? <option value='library'>My Question Library</option> : ''}
                    <option value='public'>Public Question Pool</option>
                    <option value='student'>Submitted by Students</option>
                  </select>
                  {sidebar}
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
            {
              questionList.map((questionId) => {
                const q = questionId === -1 ? null : this.props.questions[questionId]
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
  const handle = Meteor.subscribe('sessions', {isInstructor: props.isInstructor}) &&
    Meteor.subscribe('questions.inSession', props.sessionId) &&
    Meteor.subscribe('questions.library') &&
    Meteor.subscribe('questions.public') &&
    Meteor.subscribe('questions.fromStudent') &&
    Meteor.subscribe('courses')

  const courses = _.pluck(Courses.find({instructors: Meteor.userId()}).fetch(), '_id')
  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

  let libraryParams = {
    query: {'$or': [{owner: Meteor.userId()}, {courseId: { '$in': courses }, approved: true}], sessionId: {$exists: false}},
    options: {sort: { createdAt: -1 }, limit: 11}
  }

  let studentParams = {
    query: {courseId: {$exists: true}, sessionId: {$exists: false}, approved: false},
    options: {sort: { createdAt: -1 }, limit: 11}
  }

  let publicParams = {
    query: {public: true},
    options: {sort: { createdAt: -1 }, limit: 11}
  }

  return {
    questions: _.indexBy(questionsInSession, '_id'),
    libraryParams: libraryParams,
    studentParams: studentParams,
    publicParams: publicParams,
    questionLibrary: Questions.find(libraryParams.query, libraryParams.options).fetch(),
    questionPublic: Questions.find(publicParams.query, publicParams.options).fetch(),
    questionFromStudents: Questions.find(studentParams.query, studentParams.options).fetch(),
    session: session,
    loading: !handle.ready()
  }
}, _ManageSession)
