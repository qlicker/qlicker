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

import { Questions, defaultQuestion } from '../../../api/questions'
import { Courses } from '../../../api/courses'

export const createNav = (active, courseId) => {
  const isInstructor = Meteor.user().isInstructorAnyCourse()
  return (<ul className='nav nav-pills'>
    <li role='presentation' className={active === 'library' ? 'active' : ''}>
      <a role='button' onClick={() => Router.go('questions', { courseId: courseId })}>Question Library</a>
    </li>
    <li role='presentation' className={active === 'public' ? 'active' : ''}><a role='button' onClick={() => Router.go('questions.public', { courseId: courseId })}>Public Questions</a></li>
    { isInstructor
      ? <li role='presentation' className={active === 'student' ? 'active' : ''}><a role='button' onClick={() => Router.go('questions.fromStudent', { courseId: courseId })}>Student Submissions</a></li>
      : '' }
  </ul>)
}

class _QuestionsLibrary extends Component {

  constructor (props) {
    super(props)

    this.state = {
      edits: {},
      selected: null,
      questions: props.library,
      limit: 11,
      query: props.query,
      questionMap: _(props.library).indexBy('_id'),
      resetSidebar: false // only to trigger prop update of side bar when creating new question and thus clear the filter (used as toggle)
    }

    if (this.props.selected) {
      if (this.props.selected in this.state.questionMap) this.state.selected = this.props.selected
    }

    this.editQuestion = this.editQuestion.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
    this.updateQuery = this.updateQuery.bind(this)
    this.limitAndUpdate = _.throttle(this.limitAndUpdate.bind(this), 800)
  }

  editQuestion (questionId) {
    if (questionId === -1) {
      // reset the query
      this.setState({query: this.props.query, resetSidebar: true})
      const blankQuestion = _.extend({
        owner: Meteor.userId(),
        approved: true
      }, defaultQuestion)
      Meteor.call('questions.insert', blankQuestion, this.props.courseId, (e, newQuestion) => {
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
    this.setState({ selected: null, resetSidebar: false })
  }

  updateQuery (childState) {
    this.setState({resetSidebar: false})
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
    if (!_.findWhere(newQuestions, {_id: this.state.selected})) this.setState({selected: null, questions: newQuestions, questionMap: _(newQuestions).indexBy('_id')})
    else this.setState({questions: newQuestions, questionMap: _(newQuestions).indexBy('_id')})
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
    const isInstructor = Meteor.user().isInstructorAnyCourse()

    const increase = (childState) => {
      this.setState({limit: this.state.limit + 10}, () => this.updateQuery(childState))
    }
    const decrease = (childState) => {
      this.setState({limit: this.state.limit - 10}, () => this.updateQuery(childState))
    }

    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    return (
      <div className='container ql-questions-library'>
        <h1>My Question Library</h1>
        {createNav('library', this.props.courseId)}
        <div className='row'>
          <div className='col-md-4'>
            <br />
            {isInstructor
              ? <button className='btn btn-primary' onClick={() => this.editQuestion(-1)}>New Question</button>
                : ''}
            <QuestionSidebar
              questions={library}
              courseId={this.props.courseId}
              onSelect={this.editQuestion}
              increase={increase}
              decrease={decrease}
              atMax={atMax}
              updateQuery={this.limitAndUpdate}
              resetFilter={this.state.resetSidebar} />
          </div>
          <div className='col-md-8'>
            { this.state.selected
            ? <div>
              <div id='ckeditor-toolbar' />
              {isInstructor
                ? <div className='ql-edit-item-container'>
                  <QuestionEditItem
                    question={this.state.questionMap[this.state.selected]}
                    deleted={this.questionDeleted}
                    metadata autoSave />
                </div> : ''
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

export const QuestionsLibrary = createContainer(props => {
  const handle = Meteor.subscribe('courses') && Meteor.subscribe('questions.library')
  const courseId = props.courseId
  let params = {
    query: {
      // '$or': [{owner: Meteor.userId()}, {creator: Meteor.userId()}, {courseId: { '$in': courses }, approved: true}],
      // sessionId: {$exists: false}
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
}, _QuestionsLibrary)
