// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions_public.jsx: page for copying public questions

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'
import $ from 'jquery'

import { QuestionSidebar } from '../../QuestionSidebar'
import { QuestionDisplay } from '../../QuestionDisplay'

import { Questions } from '../../../api/questions'

import { createNav } from './questions_library'

class _QuestionsPublic extends Component {

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
        <h1>Public Question Pool</h1>
        {createNav('public')}
        <div className='row'>
          <div className='col-md-4'>
            <QuestionSidebar questions={this.props.public} onSelect={this.selectQuestion} />
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
                  <QuestionDisplay question={this.props.questionMap[this.state.selected]} readonly noStats />
                </div>
              </div>
            : '' }
          </div>
        </div>

      </div>)
  }

}

export const QuestionsPublic = createContainer(() => {
  const handle = Meteor.subscribe('questions.public')

  const publicQuestions = Questions
    .find({ public: true, submittedBy: { $not: Meteor.userId() }, courseId: { $exists: false } }, { sort: { createdAt: -1 } })
    .fetch()

  return {
    public: publicQuestions,
    questionMap: _(publicQuestions).indexBy('_id'),
    loading: !handle.ready()
  }
}, _QuestionsPublic)

