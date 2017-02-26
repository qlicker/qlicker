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

import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'

import { QuestionSidebar } from '../../QuestionSidebar'
import { QuestionListItem } from '../../QuestionListItem'
import { QuestionEditItem } from '../../QuestionEditItem'
import { SessionDetails } from '../../SessionDetails'

class _ManageSession extends Component {

  constructor (props) {
    super(props)

    this.state = { editing: false, session: _.extend({}, this.props.session) }

    this.sessionId = this.props.sessionId

    this.setSessionName = this.setSessionName.bind(this)
    this.addToSession = this.addToSession.bind(this)
    this.removeQuestion = this.removeQuestion.bind(this)
    this.onSortQuestions = this.onSortQuestions.bind(this)
    this.addNewQuestion = this.addNewQuestion.bind(this)
    this.newQuestionSaved = this.newQuestionSaved.bind(this)
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

  setSessionName (e) {
    const editedSession = this.state.session
    editedSession.name = e.target.value
    this.setState({ session: editedSession })
  }

  addNewQuestion () {
    if (this.state.session.questions) {
      this.state.session.questions.push(-1)
    } else this.state.session.questions = [-1]
    this.forceUpdate()
  }

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

  componentWillReceiveProps (nextProps) {
    if (nextProps && nextProps.session) this.setState({ session: nextProps.session })
  }

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
        content: <QuestionListItem question={q} remove={this.removeQuestion} />,
        id: questionId
      })
    })

    return (
      <div className='container-fluid ql-manage-session'>

        <div className='row'>
          <div className='col-md-4 col-sm-4 sidebar-container'>
            <div className='ql-session-sidebar'>
              <div className='tab-content'>
                <div role='tabpanel' className='tab-pane active' id='session'>
                  <h2>Session: { this.state.session.name }</h2>

                  <SessionDetails session={this.state.session} />

                  <hr />
                  <h3>Question Order</h3>
                  <ol className='ql-session-question-list'>
                    {<DragSortableList items={qlItems} onSort={this.onSortQuestions} />}
                  </ol>
                </div>
                <div role='tabpanel' className='tab-pane' id='questions'>
                  <QuestionSidebar
                    session={this.state.session}
                    questions={this.props.questionPool}
                    onSelect={this.addToSession} />
                </div>
              </div>

              <ul className='nav nav-tabs' id='sidebar-tabs' role='tablist'>
                <li role='presentation' className='active'><a href='#session' aria-controls='session' role='tab' data-toggle='tab'>Session</a></li>
                <li role='presentation'><a href='#questions' aria-controls='questions' role='tab' data-toggle='tab'>Question Library</a></li>
              </ul>
            </div>
          </div>
          <div className='col-md-8 col-sm-8' >

            <div className='ql-session-child-container'>
              <input type='text' className='ql-header-text-input' value={this.state.session.name} onChange={this.setSessionName} />
            </div>
            {
              questionList.map((questionId) => {
                const q = questionId === -1 ? null : this.props.questions[questionId]

                return (<div key={'question-' + questionId} className='ql-session-child-container'>
                  <QuestionEditItem
                    question={q}
                    sessionId={this.state.session._id}
                    onNewQuestion={this.newQuestionSaved} />
                </div>)
              })
            }
            <div className='ql-session-child-container'>
              <button className='btn btn-default' onClick={this.addNewQuestion}>New Question</button>
            </div>

          </div>
        </div>
      </div>)
  }

}

export const ManageSession = createContainer((props) => {
  const handle = Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inSession', props.sessionId) &&
    Meteor.subscribe('questions.library')
  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

  return {
    questions: _.indexBy(questionsInSession, '_id'),
    questionPool: Questions.find({ sessionId: {$exists: false} }).fetch(),
    session: session,
    loading: !handle.ready()
  }
}, _ManageSession)

