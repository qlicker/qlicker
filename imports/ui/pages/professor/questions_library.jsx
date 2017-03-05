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

export const createNav = (active) => {
  return (<ul className='nav nav-pills'>
    <li role='presentation' className={active === 'library' ? 'active' : ''}><a href={Router.routes['questions'].path()}>Question Library</a></li>
    <li role='presentation' className={active === 'public' ? 'active' : ''}><a href={Router.routes['questions.public'].path()}>Public Questions</a></li>
    <li role='presentation' className={active === 'student' ? 'active' : ''}><a href={Router.routes['questions.fromStudent'].path()}>Student Submissions</a></li>
  </ul>)
}

class _QuestionsLibrary extends Component {

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

  render () {
    return (
      <div className='container ql-professor-page'>
        <h1>My Question Library</h1>
        {createNav('library')}

        <button className='btn btn-default' onClick={() => this.editQuestion(-1)}>New Question</button>
        { /* list questions */
          this.props.library.map(q => {
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

export const QuestionsLibrary = createContainer(() => {
  const handle = Meteor.subscribe('questions.library')

  const library = Questions.find({
    submittedBy: Meteor.userId(),
    sessionId: {$exists: false} }).fetch()

  return {
    library: library,
    loading: !handle.ready()
  }
}, _QuestionsLibrary)

