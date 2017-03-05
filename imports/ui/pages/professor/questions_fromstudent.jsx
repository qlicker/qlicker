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

import { createNav } from './questions_library'

class _QuestionsFromStudent extends Component {

  constructor (props) {
    super(props)

    this.state = { edits: {} }

    this.copyPublicQuestion = this.copyPublicQuestion.bind(this)
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
        <h1>Student Submitted Questions</h1>
        {createNav('student')}
        { /* list questions */
          this.props.fromStudent.map(q => {
            return (<div key={q._id} >
              <QuestionListItem question={q} click={this.copyPublicQuestion} />
            </div>)
          })
        }

      </div>)
  }

}

export const QuestionsFromStudent = createContainer(() => {
  const handle = Meteor.subscribe('questions.fromStudent')

  const fromStudent = Questions.find({
    courseId: {$exists: true},
    sessionId: {$exists: false},
    public: true }).fetch()

  return {
    fromStudent: fromStudent,
    loading: !handle.ready()
  }
}, _QuestionsFromStudent)

