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

import { QuestionListItem } from '../../QuestionListItem'
import { QuestionDisplay } from '../../QuestionDisplay'

class _RunSession extends Component {

  constructor (props) {
    super(props)

    this.state = { editing: false, session: _.extend({}, this.props.session) }

    this.sessionId = this.props.sessionId

    this.removeQuestion = this.removeQuestion.bind(this)
    this.onSortQuestions = this.onSortQuestions.bind(this)
    this.setCurrentQuestion = this.setCurrentQuestion.bind(this)
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

  setCurrentQuestion (questionId) {
    Meteor.call('sessions.setCurrent', this.state.session._id, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Set Current')
    })
  }


  componentWillReceiveProps (nextProps) {
    if (nextProps && nextProps.session) this.setState({ session: nextProps.session })
  }


  render () {
    if (this.props.loading) return <div>Loading</div>

    let questionList = this.state.session.questions || []
    const qlItems = []
    questionList.forEach((questionId) => {
      const q = this.props.questions[questionId]
      qlItems.push({
        content: <QuestionListItem question={q} click={this.setCurrentQuestion} />,
        id: questionId
      })
    })

    const current = this.state.session.currentQuestion
    const q = current ? this.props.questions[current] : null
    return (
      <div className='container-fluid ql-manage-session'>

        <div className='row'>
          <div className='col-md-4 col-sm-4 sidebar-container'>
            <div className='ql-session-sidebar'>
              <h2>Session: { this.state.session.name }</h2>

              <hr />
              <h3>Questions</h3>
              <ol className='ql-session-question-list'>
                {/*{<DragSortableList items={qlItems} onSort={this.onSortQuestions} />}*/}
                {
                  questionList.map((questionId) => {
                    const q = this.props.questions[questionId]
                    if (q._id === this.state.session.currentQuestion) {
                      return <div className='current-question-list-item'><QuestionListItem question={q} click={this.setCurrentQuestion} /></div>
                    } else return <QuestionListItem question={q} click={this.setCurrentQuestion} />
                  })
                }
              </ol>

            </div>
          </div>
          <div className='col-md-8 col-sm-8' >
            <h2>Current Question: {q ? q.plainText : ''}</h2>
            <button className='btn btn-default'>Hide Admin Stuff</button>
            <button className='btn btn-default'>Show/Hide Question</button>
            <button className='btn btn-default'>Allow/Deny Answers</button>
            <button className='btn btn-default'>Show/Hide Stats</button>
            <button className='btn btn-default'>Separate Display</button>

            <hr />
            <h3>Question Preview</h3>
            <div className='ql-question-preview'>{ q ? <QuestionDisplay question={q} readonly /> : '' }</div>
          </div>
        </div>
      </div>)
  }

}

export const RunSession = createContainer((props) => {
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
}, _RunSession)

