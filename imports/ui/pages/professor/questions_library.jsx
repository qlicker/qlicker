// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions_library.jsx: page for managing and editing your own questions

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'

import { QuestionEditItem } from '../../QuestionEditItem'
import { QuestionDisplay } from '../../QuestionDisplay'
import { QuestionSidebar } from '../../QuestionSidebar'

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

    if (this.props.selected) {
      if (this.props.selected in this.props.questionMap) this.state.selected = this.props.selected
    }

    this.editQuestion = this.editQuestion.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
  }

  editQuestion (questionId) {
    if (questionId === -1) {
      const blankQuestion = {
        plainText: '', // plain text version of question
        type: -1,
        content: '', // wysiwyg display content
        options: [],
        tags: []
      }
      Meteor.call('questions.insert', blankQuestion, (e, newQuestion) => {
        if (e) return alertify.error('Error: couldn\'t add new question')
        alertify.success('New Blank Question Added')
        this.setState({ selected: null }, () => {
          this.setState({ selected: newQuestion._id })
        })
      })
    } else {
      this.setState({ selected: null }, () => {
        this.setState({ selected: questionId })
      })
    }
  }

  questionDeleted () {
    this.setState({ selected: null })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    return (
      <div className='container ql-questions-library'>
        <h1>My Question Library</h1>
        {createNav('library')}

        <div className='row'>
          <div className='col-md-4'>
            <br />
            <button className='btn btn-primary' onClick={() => this.editQuestion(-1)}>New Question</button>
            <QuestionSidebar questions={this.props.library} onSelect={this.editQuestion} />
          </div>
          <div className='col-md-8'>
            { this.state.selected
            ? <div>
              <div className='ql-edit-item-container'>
                <QuestionEditItem
                  question={this.props.questionMap[this.state.selected]}
                  deleted={this.questionDeleted}
                  metadata autoSave />
              </div>
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

export const QuestionsLibrary = createContainer(() => {
  const handle = Meteor.subscribe('questions.library')

  const library = Questions.find({
    submittedBy: Meteor.userId(),
    sessionId: {$exists: false}
  }, { sort: { createdAt: -1 } })
  .fetch()

  return {
    library: library,
    questionMap: _(library).indexBy('_id'),
    loading: !handle.ready()
  }
}, _QuestionsLibrary)

