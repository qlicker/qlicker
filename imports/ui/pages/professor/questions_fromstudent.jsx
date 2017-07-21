// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions_fromstudent.jsx: page for managing student submitted questions

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'
import $ from 'jquery'

import { QuestionDisplay } from '../../QuestionDisplay'
import { QuestionSidebar } from '../../QuestionSidebar'
import { Questions } from '../../../api/questions'

import { createNav } from './questions_library'

class _QuestionsFromStudent extends Component {

  constructor (props) {
    super(props)

    this.state = { edits: {}, selected: null }

    this.copyPublicQuestion = this.copyPublicQuestion.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
    this.selectQuestion = this.selectQuestion.bind(this)
  }

  selectQuestion (questionId) {
    this.setState({ selected: questionId })
  }

  copyPublicQuestion (questionId) {
    Meteor.call('questions.copyToLibrary', questionId, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Copied to Library')
    })
  }

  deleteQuestion (questionId) {
    Meteor.call('questions.delete', questionId, (error) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Deleted')
      this.questionDeleted()
    })
  }

  questionDeleted () {
    this.setState({ selected: null })
  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    $('[data-toggle="tooltip"]').tooltip()
  }

  render () {
    return (
      <div className='container ql-questions-library'>
        <h1>Student Submitted Questions</h1>
        {createNav('student')}

        <div className='row'>
          <div className='col-md-4'>
            <QuestionSidebar questions={this.props.fromStudent} onSelect={this.selectQuestion} />
          </div>
          <div className='col-md-8'>
            { this.state.selected
              ? <div>
                <h3>Preview Question</h3>
                <button className='btn btn-default'
                  onClick={() => { this.copyPublicQuestion(this.props.questionMap[this.state.selected]._id) }}
                  data-toggle='tooltip'
                  data-placement='left'
                  title='Create a copy to use in your own sessions'>
                  {Meteor.user().hasGreaterRole('professor') ? 'Copy to Library' : 'Approve for course'}
                </button>
                <button className='btn btn-default'
                  onClick={() => { this.deleteQuestion(this.props.questionMap[this.state.selected]._id) }}
                  data-toggle='tooltip'
                  data-placement='left'>
                    Delete
                  </button>
                <div className='ql-preview-item-container'>
                  <QuestionDisplay question={this.props.questionMap[this.state.selected]} readonly noStats />
                </div>
              </div>
            : '' }
          </div>
        </div>
      </div>)
  }

}

export const QuestionsFromStudent = createContainer(() => {
  const handle = Meteor.subscribe('questions.fromStudent') && Meteor.subscribe('users.myStudents')

  const fromStudent = Questions.find({
    courseId: {$exists: true},
    sessionId: {$exists: false},
    public: true
  }, { sort: { createdAt: -1 } })
  .fetch()

  return {
    fromStudent: fromStudent,
    questionMap: _(fromStudent).indexBy('_id'),
    loading: !handle.ready()
  }
}, _QuestionsFromStudent)

