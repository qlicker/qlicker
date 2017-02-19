/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import { createContainer } from 'meteor/react-meteor-data'
import DragSortableList from 'react-drag-sortable'

import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'

import { AddQuestionModal } from '../../modals/AddQuestionModal'
import { QuestionListItem } from '../../QuestionListItem'

class _ManageSession extends Component {

  constructor (props) {
    super(props)

    this.state = { editing: false, session: _.extend({}, this.props.session) }

    this.sessionId = this.props.sessionId

    this.handleSubmit = this.handleSubmit.bind(this)
    this.setValue = this.setValue.bind(this)
    this.removeQuestion = this.removeQuestion.bind(this)
    this.onSortQuestions = this.onSortQuestions.bind(this)
  }

  /**
   * setValue(Event: e)
   * set edited values for session editing
   */
  setValue (e) {
    let stateEdits = this.state
    let key = e.target.dataset.name
    if (key === 'quiz') stateEdits.session[e.target.dataset.name] === (e.target.value === 'true')
    else stateEdits.session[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for session edit form. Calls sessions.edit
   */
  handleSubmit (e) {
    e.preventDefault()

    Meteor.call('sessions.edit', this.state.session, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Question Added')
        this.setState({ editing: false })
      }
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

  render () {
    const startEditing = () => {
      this.setState({ editing: true })
    }
    const toggleAddingQuestion = () => {
      this.setState({ addingQuestion: !this.state.addingQuestion })
    }

    const quizDate = this.state.quiz ? 'Deadline: ' + this.props.session.dueDate : ''
    const quizEdit = this.state.quiz ? 'Deadline: Date picker here' : ''

    const qlItems = []
    this.state.session.questions.forEach((questionId) => {
      const q = this.props.questions[questionId]
      qlItems.push({
        content: <QuestionListItem question={q} remove={this.removeQuestion} />,
        id: questionId
      })
    })

    return (
      <div className='container ql-manage-session'>
        <h2>Session: { this.state.session.name } </h2>
        { !this.state.editing ? <button className='btn btn-default' ref='editButton' onClick={startEditing}>Edit Session</button> : '' }
        <form ref='editSessionForm' className='ql-form-editsession' onSubmit={this.handleSubmit}>
          Name: { this.state.editing
            ? <input type='text' className='form-control' data-name='name' onChange={this.setValue} value={this.state.session.name} />
            : this.state.session.name }<br />

          Description: { this.state.editing
            ? <textarea className='form-control' data-name='description'
              onChange={this.setValue}
              placeholder='Quiz on topic 3'
              value={this.state.session.description} />
            : this.state.session.description }<br />

          Format: { this.state.editing
            ? <select className='form-control' data-name='quiz' onChange={this.setValue} defaultValue={this.state.session.quiz}>
              <option value={false}>Lecture Poll</option>
              <option value>Online Quiz</option>
            </select>
            : this.state.session.quiz ? 'Quiz' : 'Lecture Poll' }<br />

          Status: { this.state.editing
            ? <select className='form-control' data-name='status' onChange={this.setValue} defaultValue={this.state.session.status}>
              <option value='hidden'>Draft (Hidden)</option>
              <option value='visible'>Visible</option>
              <option value='running'>Active</option>
              <option value='done'>Done</option>
            </select>
            : this.state.session.status }<br />

          { this.state.editing ? quizDate : quizDate }
          { this.state.editing ? <input className='btn btn-default' type='submit' /> : '' }
        </form>

        <h3>Questions</h3>
        <button className='btn btn-default' ref='addQuestionButton' onClick={toggleAddingQuestion}>Add Question</button>
        <ol className='ql-session-question-list'>
          {<DragSortableList items={qlItems} onSort={this.onSortQuestions} />}
        </ol>

        { /* add question modal */
          this.state.addingQuestion
            ? <AddQuestionModal
              session={this.props.session}
              questions={this.props.questionPool}
              done={toggleAddingQuestion} />
            : ''
        }
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
    questionPool: Questions.find({ originalQuestion: {$exists: false} }).fetch(),
    session: session,
    loading: !handle.ready()
  }
}, _ManageSession)

