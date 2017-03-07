// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_questions.jsx: question library and management

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'
import $ from 'jquery'

import { QuestionListItem } from '../../QuestionListItem'

import { Questions } from '../../../api/questions'
import { QuestionDisplay } from '../../QuestionDisplay'

import { createNav } from './questions_library'

class _QuestionsFromStudent extends Component {

  constructor (props) {
    super(props)

    this.state = { edits: {}, selected: null }

    this.copyPublicQuestion = this.copyPublicQuestion.bind(this)
    this.selectQuestion = this.selectQuestion.bind(this)
  }

  selectQuestion (questionId) {
    this.setState({ selected: questionId })
  }

  copyPublicQuestion (questionId) {
    Meteor.call('questions.copyToLibrary', questionId, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Copied to Library')
      Router.go('questions', { _id: newQuestionId })
    })
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
            <div className='ql-question-list'>
              { /* list questions */
                this.props.fromStudent.map(q => {
                  return (<div key={q._id} >
                    <QuestionListItem question={q} click={() => this.selectQuestion(q._id)} />
                  </div>)
                })
              }
            </div>
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
                    Copy to Library
                  </button>
                <div className='ql-preview-item-container'>
                  <QuestionDisplay question={this.props.questionMap[this.state.selected]} readonly />
                </div>
              </div>
            : '' }
          </div>
        </div>
      </div>)
  }

}

export const QuestionsFromStudent = createContainer(() => {
  const handle = Meteor.subscribe('questions.fromStudent')

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

