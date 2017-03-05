// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_questions.jsx: question library and management

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'
import $ from 'jquery'

// import { CreateQuestionModal } from '../../modals/CreateQuestionModal'
import { QuestionListItem } from '../../QuestionListItem'
import { QuestionEditItem } from '../../QuestionEditItem'
import { QuestionDisplay } from '../../QuestionDisplay'

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

    this.state = { edits: {}, selected: null }

    this.editQuestion = this.editQuestion.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
  }

  editQuestion (questionId) {
    this.setState({ selected: questionId })
    // const e = _({}).extend(this.state.edits[questionId])
    // e[questionId] = (questionId in this.state.edits) ? !this.state.edits[questionId] : true
    // this.setState({
    //   edits: e
    // })
  }

  deleteQuestion (questionId) {
    Meteor.call('questions.delete', questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Deleted')
    })
  }

  render () {
    return (
      <div className='container ql-questions-library'>
        <h1>My Question Library</h1>
        {createNav('library')}

        <div className='row'>
          <div className='col-md-4'>
            <br />
            <button className='btn btn-default' onClick={() => this.editQuestion(-1)}>New Question</button>
            <div className='ql-question-list'>
              { /* list questions */
                this.props.library.map(q => {
                  return (<div key={q._id} >
                    <QuestionListItem question={q} click={this.editQuestion} delete={this.deleteQuestion} />
                  </div>)
                })
              }
            </div>
          </div>
          <div className='col-md-8'>
            { this.state.selected
            ? <div>
              <h3>Edit Question</h3>
              <div className='ql-edit-item-container'>
                <QuestionEditItem question={this.props.questionMap[this.state.selected]} tags />
              </div>
              <h3>Preview Question</h3>
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

export const QuestionsLibrary = createContainer(() => {
  const handle = Meteor.subscribe('questions.library')

  const library = Questions.find({
    submittedBy: Meteor.userId(),
    sessionId: {$exists: false} }).fetch()

  return {
    library: library,
    questionMap: _(library).indexBy('_id'),
    loading: !handle.ready()
  }
}, _QuestionsLibrary)

