// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions_fromstudent.jsx: page for managing student submitted questions

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'

import { QuestionDisplay } from '../../QuestionDisplay'
import { QuestionSidebar } from '../../QuestionSidebar'
import { Questions } from '../../../api/questions'

import { createNav } from './questions_library'
import $ from 'jquery'

class _QuestionsFromStudent extends Component {

  constructor (props) {
    super(props)

    this.state = {
      edits: {},
      selected: null,
      questions: props.library,
      limit: 11,
      query: props.query,
      questionMap: _(props.library).indexBy('_id')
    }

    this.approveQuestion = this.approveQuestion.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.makeQuestionPublic = this.makeQuestionPublic.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
    this.selectQuestion = this.selectQuestion.bind(this)
    this.updateQuery = this.updateQuery.bind(this)
    this.limitAndUpdate = _.throttle(this.limitAndUpdate.bind(this), 800)
  }

  selectQuestion (questionId) {
    this.setState({ selected: questionId })
  }

  approveQuestion (questionId) {
    let question = this.state.questionMap[questionId]
    question.approved = true
    question.public = false
    question.owner = Meteor.userId()
    question.createdAt = new Date()
    Meteor.call('questions.update', question, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question moved to library')
    })
    this.selectQuestion(null)
  }

  deleteQuestion (questionId) {
    Meteor.call('questions.delete', questionId, (error) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Deleted')
      this.questionDeleted()
    })
  }

  makeQuestionPublic (questionId) {
   // by making it public, you take over ownership, so student cannot delete it anymore
   // it will also show in the library for any instructor of the course
    let question = this.state.questionMap[questionId]
    question.approved = true // this makes it editable by any instructor of the course

    question.public = true
    question.owner = Meteor.userId()
    question.createdAt = new Date()
    Meteor.call('questions.update', question, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question moved to public area')
    })
    this.selectQuestion(null)
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

  updateQuery (childState) {
    let params = this.state.query
    params.options.limit = this.state.limit

    if (childState.questionType > -1) params.query.type = childState.questionType
    else params.query = _.omit(params.query, 'type')
    if (parseInt(childState.courseId) !== -1) params.query.courseId = childState.courseId
    else params.query = _.omit(params.query, 'courseId')
    if (childState.searchString) params.query.plainText = {$regex: '.*' + childState.searchString + '.*', $options: 'i'}
    else params.query = _.omit(params.query, 'plainText')
    if (childState.userSearchString) {
      const users = Meteor.users.find({ $or: [{'profile.lastname': {$regex: '.*' + childState.userSearchString + '.*', $options: 'i'}},
                                               {'profile.firstname': {$regex: '.*' + childState.userSearchString + '.*', $options: 'i'}}] }).fetch()
      const uids = _(users).pluck('_id')
      params.query.creator = {$in: uids}
    } else params.query = _.omit(params.query, 'creator')
    if (childState.tags.length) params.query['tags.value'] = { $all: _.pluck(childState.tags, 'value') }
    else params.query = _.omit(params.query, 'tags.value')

    const newQuestions = Questions.find(params.query, params.options).fetch()
    if (!_.findWhere(newQuestions, {_id: this.state.selected})) {
      this.setState({ selected: null, questions: newQuestions, questionMap: _(newQuestions).indexBy('_id') })
    } else this.setState({questions: newQuestions})
  }

  limitAndUpdate (data) {
    this.setState({limit: 11}, () => this.updateQuery(data))
  }

  componentWillReceiveProps () {
    const newQuestions = Questions.find(this.state.query.query, this.state.query.options).fetch()
    if (!_.findWhere(newQuestions, {_id: this.state.selected})) {
      this.setState({ selected: null, questions: newQuestions, questionMap: _(newQuestions).indexBy('_id') })
    } else this.setState({questions: newQuestions, questionMap: _(newQuestions).indexBy('_id')})
  }

  render () {
    let library = this.state.questions || []

    const atMax = library.length !== this.state.limit
    if (!atMax) library = library.slice(0, -1)

    const increase = (childState) => {
      this.setState({limit: this.state.limit + 10}, () => this.updateQuery(childState))
    }
    const decrease = (childState) => {
      this.setState({limit: this.state.limit - 10}, () => this.updateQuery(childState))
    }

    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    return (
      <div className='container ql-questions-library'>
        <h1>Student Submitted Questions</h1>
        {createNav('student')}

        <div className='row'>
          <div className='col-md-4'>
            <QuestionSidebar
              questions={library}
              onSelect={this.selectQuestion}
              increase={increase}
              decrease={decrease}
              atMax={atMax}
              updateQuery={this.limitAndUpdate} />
          </div>
          <div className='col-md-8'>
            { this.state.selected
              ? <div>
                <h3>Preview Question</h3>
                <button className='btn btn-default'
                  onClick={() => { this.approveQuestion(this.state.questionMap[this.state.selected]._id) }}
                  data-toggle='tooltip'
                  data-placement='left'
                  title='Create a copy to use in your own sessions'>
                  {Meteor.user().hasGreaterRole('professor') ? 'Copy to Library' : 'Approve for course'}
                </button>
                <button className='btn btn-default'
                  onClick={() => { this.makeQuestionPublic(this.state.questionMap[this.state.selected]._id) }}
                  data-toggle='tooltip'
                  data-placement='left'
                  title='Make the question public'>
                  Make Public
                </button>

                <button className='btn btn-default'
                  onClick={() => { this.deleteQuestion(this.state.questionMap[this.state.selected]._id) }}
                  data-toggle='tooltip'
                  data-placement='left'>
                    Delete
                  </button>
                <div className='ql-preview-item-container'>
                  {this.state.selected
                    ? <QuestionDisplay question={this.state.questionMap[this.state.selected]} forReview readonly />
                    : ''
                  }
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

  let params = {
    query: {
      courseId: {$exists: true},
      sessionId: {$exists: false},
      approved: false,
      public: false
    },
    options: {sort:
      { createdAt: -1 },
      limit: 11
    }
  }

  const library = Questions.find(params.query, params.options).fetch()

  return {
    query: params,
    library: library,
    loading: !handle.ready()
  }
}, _QuestionsFromStudent)
