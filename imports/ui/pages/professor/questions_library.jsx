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
import { URLSearchParams } from 'url';

class _QuestionsLibrary extends Component {

  constructor (props) {
    super(props)

    this.state = {
      edits: {},
      selected: null,
      questions: props.questions,
      query: props.query,
      questionMap: _(props.questions).indexBy('_id'),
      resetSidebar: false // only to trigger prop update of side bar when creating new question and thus clear the filter (used as toggle)
    }

    if (this.props.selected) {
      if (this.props.selected in this.state.questionMap) this.state.selected = this.props.selected
    }

    this.exportQuestions = this.exportQuestions.bind(this)
    this.importQuestions = this.importQuestions.bind(this)
    this.editQuestion = this.editQuestion.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
    this.updateQuery = this.updateQuery.bind(this)

    Meteor.call('courses.getCourseCode', this.props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course code')
      else this.setState({ courseCode: c })
    })
  }

  exportQuestions () {
    const courseId = this.props.courseId
    const date = new Date()
    let data = {
      originalCourse: courseId,
      date: date,
      questions: this.props.questions
    }

    const jsonData = JSON.stringify(data)
    
    const a = document.createElement("a")
    const file = new Blob([jsonData], {type: 'text/plain'})
    a.href = URL.createObjectURL(file)

    Meteor.call('courses.getCourseCode', courseId, (err, result) => {
      if (err) a.download = 'questions' + courseId + date + '.json'
      else a.download = 'Questions' + result + date + '.json'
      a.click()
    })
  }

  importQuestions (event) {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.readAsText(file, 'UTF-8')
      reader.onload = (e) => {
        const data = JSON.parse(e.target.result)
        const questions = data.questions

        questions.forEach(question => {
          question.courseId = this.props.courseId
          question.createdAt = new Date()
          delete question._id
          Meteor.call('questions.insert', question, (err, result) => {
            if (err) alertify.error('Error: ' + err.error)
            else alertify.success('Questions saved')
          })
        })
      }
    }
    else alertify.error('Error: Incorrect file format')
  }

  editQuestion (questionId) {
    if (questionId === -1) {
      // reset the query
      this.setState({query: this.props.query, resetSidebar: true})
      let tags = []
      Meteor.call('courses.getCourseCodeTag', this.props.courseId, (e, tag) => {
        if (tag) tags = [tag]
      })
      const blankQuestion = _.extend({
        owner: Meteor.userId(),
        approved: true,
        courseId: this.props.courseId,
        tags: tags
      }, defaultQuestion)
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
    this.setState({ selected: null, resetSidebar: false })
  }

  updateQuery (childState) {
    
    this.setState({resetSidebar: false})
    let params = this.state.query
    if (childState.questionType > -1) params.query.type = childState.questionType
    else params.query = _.omit(params.query, 'type')
    if (childState.questionApproved) params.query.approved = childState.questionApproved
    else params.query = _.omit(params.query, 'approved')
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
    if(!params.query.courseId) delete params.query.courseId
    
    if (this.props.library !== 'shared') {
      params.query.courseId = this.props.courseId
    }
    console.log(this.state.query.query)
    const query = _.extend(params.query, this.state.query.query)
    console.log(query)
    const newQuestions = Questions.find(query, params.options).fetch()
  
    this.setState({ questions: newQuestions })  
  }

  componentWillReceiveProps (nextProps) {
    const newQuestions = Questions.find(nextProps.query.query, nextProps.query.options).fetch()
    if (!_.findWhere(newQuestions, {_id: this.state.selected})) {
      this.setState({ questions: newQuestions, selected: null, questionMap: _(newQuestions).indexBy('_id') })
    } else this.setState({ questions: newQuestions, questionMap: _(newQuestions).indexBy('_id') }) 
  }

  render () {
    let library = this.state.questions || []
    const isInstructor = Meteor.user().isInstructorAnyCourse()

    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    return (
      <div>
        <div className='row'>
          <div className='col-md-4'>
            <br />
            {isInstructor && this.props.library === 'library'
              ? <div className='ql-questions-library ql-sidebar-buttons'>
                  <button className='btn btn-primary' onClick={() => this.editQuestion(-1)}>New Question</button>
                  <button className='btn btn-primary' onClick={this.exportQuestions}>Export to File</button>
                  <label className='btn btn-primary'>
                    <input style={{'display' : 'none'}} type='file' onChange={this.importQuestions} />
                    Import from File
                  </label>
                </div>
                : ''}
            <QuestionSidebar
              questions={library}
              courseId={this.props.courseId}
              onSelect={this.editQuestion}
              updateQuery={this.updateQuery}
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

  //This step is done since questions.library and questions.public are used in other components
  let inCourse = ''
  props.library === 'library' || props.library === 'public' ? inCourse = 'InCourse' : null
  
  const subscription = 'questions.' + props.library + inCourse
  const handle =  Meteor.subscribe(subscription, props.courseId)
  const courseId = props.courseId
  
  
  let params = {}
  
  if (props.library === 'library') {
    params = {
      query: {
        courseId: courseId,
      },
      options: {
        sort: { createdAt: -1 }
      }
    }
  }

  if (props.library === 'public') {
    params = {
      query: {
        public: true,
        courseId: courseId
      },
      options: {
        sort: { createdAt: -1 },
      }
    }
  }
  
  if (props.library === 'student') {
    params = {
      query: {
        courseId: courseId,
        sessionId: {$exists: false},
        approved: false,
        public: false
      },
      options: {sort:
        { createdAt: -1 },   
      }
    }
  }

  if (props.library === 'shared') {
    params = {
      query: {
        shared: true
      },
      options: {sort:
        { createdAt: -1 },
      }
    }
  }

  const questions = Questions.find().fetch()

  return {
    query: params,
    questions: questions,
    courseId: courseId,
    selected: questions[0]._id,
    loading: !handle.ready()
  }
}, _QuestionsLibrary)
