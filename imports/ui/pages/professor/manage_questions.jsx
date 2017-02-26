// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_questions.jsx: question library and management

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'
import $ from 'jquery'

import { CreateQuestionModal } from '../../modals/CreateQuestionModal'
import { QuestionListItem } from '../../QuestionListItem'

import { Questions } from '../../../api/questions'

class _ManageQuestions extends Component {

  constructor (props) {
    super(props)

    this.state = { edits: {} }

    this.editQuestion = this.editQuestion.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
  }

  editQuestion (questionId) {
    const e = _({}).extend(this.state.edits[questionId])
    e[questionId] = (questionId in this.state.edits) ? !this.state.edits[questionId] : true
    this.setState({
      edits: e
    })
  }

  deleteQuestion (questionId) {
    Meteor.call('questions.delete', questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Deleted')
    })
  }

  componentDidMount () {
    $('#ql-question-source-tabs a').click(function (e) {
      e.preventDefault()
      $(this).tab('show')
    })
  }

  copyPublicQuestion (questionId) {
    Meteor.call('questions.copyToLibrary', questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Copied to Library')
    })
  }

  render () {
    return (
      <div className='container ql-professor-page'>
        <h1>Question Library</h1>

        <div>
          <ul className='nav nav-tabs' role='tablist' id='ql-question-source-tabs'>
            <li role='presentation' className='active'><a href='#my-questions' aria-controls='my-questions' role='tab' data-toggle='tab'>My Questions</a></li>
            <li role='presentation'><a href='#public-questions' aria-controls='public-questions' role='tab' data-toggle='tab'>Public</a></li>
            <li role='presentation'><a href='#student-questions' aria-controls='student-questions' role='tab' data-toggle='tab'>Student Submitted</a></li>
          </ul>

          <div className='tab-content'>
            <div role='tabpanel' className='tab-pane active' id='my-questions'>
              <button className='btn btn-default' onClick={() => this.editQuestion(-1)}>New Question</button>
              { /* list questions */
                this.props.library.map(q => {
                  return (<div key={q._id} >
                    <QuestionListItem question={q} click={this.editQuestion} delete={this.deleteQuestion} />
                    { this.state.edits[q._id] ? <CreateQuestionModal done={() => this.editQuestion(q._id)} question={q} /> : '' }
                  </div>)
                })
              }
            </div>
            <div role='tabpanel' className='tab-pane' id='public-questions'>
              { /* list questions */
                this.props.public.map(q => {
                  return (<div key={q._id} >
                    <QuestionListItem question={q} click={this.copyPublicQuestion} />
                  </div>)
                })
              }
            </div>
            <div role='tabpanel' className='tab-pane' id='student-questions'>
              { /* list questions */
                this.props.fromStudent.map(q => {
                  return (<div key={q._id} >
                    <QuestionListItem question={q} click={this.copyPublicQuestion} />
                  </div>)
                })
              }
            </div>
          </div>
        </div>

        { this.state.edits[-1] ? <CreateQuestionModal done={() => this.editQuestion(-1)} /> : '' }
      </div>)
  }

}

export const ManageQuestions = createContainer(() => {
  const handle = Meteor.subscribe('questions.library') &&
    Meteor.subscribe('questions.public') &&
    Meteor.subscribe('questions.fromStudent')

  const library = Questions.find({
    submittedBy: Meteor.userId(),
    sessionId: {$exists: false} }).fetch()

  const publicQuestions = Questions.find({ public: true, courseId: {$exists: false} }).fetch()

  const fromStudent = Questions.find({
    courseId: {$exists: true},
    sessionId: {$exists: false},
    public: true }).fetch()

  return {
    library: library,
    public: publicQuestions,
    fromStudent: fromStudent,
    loading: !handle.ready()
  }
}, _ManageQuestions)

