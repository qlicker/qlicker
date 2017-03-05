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

class _QuestionsPublic extends Component {

  constructor (props) {
    super(props)

    this.state = { edits: {} }

    this.copyPublicQuestion = this.copyPublicQuestion.bind(this)
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
        <h1>Public Question Pool</h1>
        {createNav('public')}
        { /* list questions */
          this.props.public.map(q => {
            return (<div key={q._id} >
              <QuestionListItem question={q} click={this.copyPublicQuestion} />
            </div>)
          })
        }

      </div>)
  }

}

export const QuestionsPublic = createContainer(() => {
  const handle = Meteor.subscribe('questions.public')

  const publicQuestions = Questions.find({ public: true, courseId: {$exists: false} }).fetch()

  return {
    public: publicQuestions,
    loading: !handle.ready()
  }
}, _QuestionsPublic)

