// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions_public.jsx: page for copying public questions

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'

import { QuestionSidebar } from '../../QuestionSidebar'
import { QuestionDisplay } from '../../QuestionDisplay'

import { Questions } from '../../../api/questions'

import { createNav } from './questions_library'
import $ from 'jquery'

class _QuestionsPublic extends Component {

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
    
    this.copyPublicQuestion = this.copyPublicQuestion.bind(this)
    this.selectQuestion = this.selectQuestion.bind(this)
    this.updateQuery = this.updateQuery.bind(this)
    this.limitAndUpdate = _.throttle(this.limitAndUpdate.bind(this), 800)
  }

  selectQuestion (questionId) {
    this.setState({ selected: questionId })
  }

  copyPublicQuestion (questionId) {
    const cId = this.state.questionMap[questionId].courseId
    Meteor.call('questions.copyToLibrary', questionId, cId, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Copied to Library')
    })
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
    } else this.setState({questions: newQuestions, questionMap: _(newQuestions).indexBy('_id')})
    
  }

  limitAndUpdate (data) {
    this.setState({limit: 11}, () => this.updateQuery(data))
  }

  componentWillReceiveProps () {
    const newQuestions = Questions.find(this.state.query.query, this.state.query.options).fetch()
    if (!_.findWhere(newQuestions, {_id: this.state.selected})) {
      this.setState({ selected: null, questions: newQuestions, questionMap: _(newQuestions).indexBy('_id') })
    } else this.setState({questions: newQuestions})
  }

  render () {
    let library = this.state.questions || []
    let userId = Meteor.userId()
    // let isInstructor = Meteor.user().isInstructorAnyCourse()
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
        <h1>Public Question Pool</h1>
        {createNav('public', this.props.courseId)}
        <div className='row'> 
          <div className='col-md-4'>
          {console.log(library)}
            <QuestionSidebar
              questions={library}
              courseId={this.props.courseId}
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
                { (this.state.questionMap[this.state.selected].owner !== userId &&
                   this.state.questionMap[this.state.selected].creator !== userId)
                  ? <button className='btn btn-default'
                    onClick={() => { this.copyPublicQuestion(this.state.questionMap[this.state.selected]._id) }}
                    data-toggle='tooltip'
                    data-placement='left'
                    title='Create a copy for your library'>
                    Copy to Library
                    </button>
                   : ''
                }
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

export const QuestionsPublic = createContainer(props => {
  const handle = Meteor.subscribe('questions.public')
  const courseId = props.courseId
  const params = {
    query: {
      public: true,
      courseId: courseId
    },
    options: {
      sort: { createdAt: -1 },
      limit: 11
    }
  }

  const library = Questions.find(params.query, params.options).fetch()
  
  return {
    query: params,
    library: library,
    courseId: courseId,
    loading: !handle.ready()
  }
}, _QuestionsPublic)
