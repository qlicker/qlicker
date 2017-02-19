// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_questions.jsx: question library and management

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { DraftHelper } from '../../draft-helpers'

import { CreateQuestionModal } from '../modals/CreateQuestionModal'
import { QuestionListItem } from '../QuestionListItem'

import { Questions } from '../../api/questions'

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

  render () {
    return (
      <div className='container ql-professor-page'>
        <h1>Question Library</h1>

        <button className='btn btn-default' onClick={() => this.editQuestion(-1)}>New Question</button>

        { /* list questions */
          this.props.questions.map(q => {
            return (<div key={q._id} >
              <QuestionListItem question={q} click={this.editQuestion} delete={this.deleteQuestion} />
              { this.state.edits[q._id] ? <CreateQuestionModal done={() => this.editQuestion(q._id)} question={q} /> : '' }
            </div>)
          })
        }

        { this.state.edits[-1] ? <CreateQuestionModal done={() => this.editQuestion(-1)} /> : '' }
      </div>)
  }

}

export const ManageQuestions = createContainer(() => {
  const handle = Meteor.subscribe('questions.library')

  return {
    questions: Questions.find({ }).fetch(),
    loading: !handle.ready()
  }
}, _ManageQuestions)

