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
  
    this.convertField = this.convertField.bind(this)
    this.exportQuestions = this.exportQuestions.bind(this)
    this.importQuestions = this.importQuestions.bind(this)
    this.editQuestion = this.editQuestion.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
    this.deleteAllQuestions = this.deleteAllQuestions.bind(this)
    this.updateQuery = this.updateQuery.bind(this)
    this.approveQuestion = this.approveQuestion.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.makeQuestionPublic = this.makeQuestionPublic.bind(this)

    Meteor.call('courses.getCourseCode', this.props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course code')
      else this.state.courseCode = c
    })

    Meteor.call('courses.hasAllowedStudentQuestions', this.props.courseId, (e, allowed) => {
      if (e) alertify.error('Cannot get course permissions')
      else this.state.allowedStudentQuestions = allowed
    })
  }

  convertImageToBase64 (url, count, callback) {
    let xhttp = new XMLHttpRequest()
    xhttp.responseType = 'blob'
    xhttp.open('GET', url, true)
    xhttp.send()
    
    xhttp.onload = function() {
      let fileReader = new FileReader()
      fileReader.onloadend = function() {
          newItem = fileReader.result
          let done = false
          if (count === 0) done = true
          callback(newItem, done)         
      }
      fileReader.readAsDataURL(xhttp.response)     
    }
  }

  convertField (questions, question, date, courseId, count, content) {
    let newContent = ''
    content.forEach(item => {
      let newItem = item
      if (item.search(/src(s*)=/) !== -1 && item.search('data') === -1) { // convert image to data uri if image source is a url
        let url = item.split(/src(s*)=/)[2]
        url = url.replace(/"/g, '') //Trim any quotations
        // Callback executes asynchronously
        this.convertImageToBase64(url, count, (result, done) => {
          if (done) {
            const dataURL = '<img src=' + result + ' />'
            newContent = newContent.replace(newItem, dataURL)
            question.solution = newContent
            let data = {
              originalCourse: courseId,
              date: date,
              questions: questions
            }
            
            const jsonData = JSON.stringify(data)
            
            const a = document.createElement("a")
            const file = new Blob([jsonData], {type: 'text/plain'})
            a.href = URL.createObjectURL(file)

            Meteor.call('courses.getCourseCode', courseId, (err, result) => {
              if (err) a.download = 'Questions.json'
              else a.download = 'Questions' + result + '.json'
              a.click()
            })
          }
        })
        count += 1
      }  
      newContent = newContent + ' ' +  newItem      
    })
    if (count === 0) {
      let data = {
        originalCourse: courseId,
        date: date,
        questions: questions
      }
      
      const jsonData = JSON.stringify(data)
      
      const a = document.createElement("a")
      const file = new Blob([jsonData], {type: 'text/plain'})
      a.href = URL.createObjectURL(file)

      Meteor.call('courses.getCourseCode', courseId, (err, result) => {
        if (err) a.download = 'Questions.json'
        else a.download = 'Questions' + result + '.json'
        a.click()
      })
    }
  }

  exportQuestions () {
    const courseId = this.props.courseId
    const date = new Date()
    let questions = this.state.questions
    let count = 0
    const splitPattern = /<\s*img(.*)\/>/
    questions.forEach(question => {
      this.convertField(questions, question, date, courseId, count, question.content.split(splitPattern))
      count += 1
      this.convertField(questions, question, date, courseId, count, question.solution.split(splitPattern))
      question.options.forEach(option => {
        this.convertField(questions, question, date, courseId, count, option.content.split(splitPattern))
      })
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
        approved: Meteor.user().isInstructor(this.props.courseId),
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

  approveQuestion (questionId) {
    let question = this.state.questionMap[questionId]
    question.approved = true
    question.public = false
    question.owner = Meteor.userId()
    question.createdAt = new Date()
    question.courseId = this.props.courseId
    question.shared = false
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
    this.setState({ selected: null, resetSidebar: false })
  }

  deleteAllQuestions () {
    if (confirm('Are you sure?')) {
      this.state.questions.forEach(question => {
        Meteor.call('questions.delete', question._id, (err) => {
          if (err) alertify.error('Error deleting questions')
          else alertify.success('All questions deleted')
        })
      })
      this.setState({ selected: null, resetSidebar: false })
    }
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
    
    if (this.props.library !== 'sharedWithUser') {
      params.query.courseId = this.props.courseId
    }
  
    const query = _.extend(params.query, this.state.query.query)
    
   
    const newQuestions = Questions.find(query, params.options).fetch()
    this.setState({ questions: newQuestions })  
  }

  componentWillReceiveProps (nextProps) {
    const newQuestions = Questions.find(nextProps.query.query, nextProps.query.options).fetch()
    if (!_.findWhere(newQuestions, {_id: this.state.selected})) {
      this.setState({ questions: newQuestions, selected: null, questionMap: _(newQuestions).indexBy('_id'), query: nextProps.query })
    } else this.setState({ questions: newQuestions, questionMap: _(newQuestions).indexBy('_id'), query: nextProps.query }) 
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
            {(isInstructor || this.state.allowedStudentQuestions) && this.props.library === 'library'
              ? <div className='ql-questions-library ql-sidebar-buttons'>
                  <button className='btn btn-primary' onClick={() => this.editQuestion(-1)}>New Question</button>
                  <button className='btn btn-primary' onClick={this.exportQuestions}>Export to File</button>
                  <label className='btn btn-primary'>
                    <input style={{'display' : 'none'}} type='file' onChange={this.importQuestions} />
                    Import from File
                  </label>
                </div>
                : ''}
            <button className='btn btn-primary' style={{'width':'100%'}} onClick={this.deleteAllQuestions}>Clear library</button>
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
                {(isInstructor || this.state.allowedStudentQuestions) && this.props.editable && (isInstructor || !this.state.questionMap[this.state.selected].approved)
                  ? <div>
                      <div id='ckeditor-toolbar' />
                      <div className='ql-edit-item-container'>
                        <QuestionEditItem
                          courseId={this.props.courseId}
                          question={this.state.questionMap[this.state.selected]}
                          deleted={this.questionDeleted}
                          metadata autoSave />
                      </div>
                    </div>
                  : <div>
                      <h3>Preview Question</h3>
                      { this.props.library === 'sharedWithUser'
                        ? <div>
                            <button className='btn btn-default'
                              onClick={() => { this.approveQuestion(this.state.questionMap[this.state.selected]._id) }}
                              data-toggle='tooltip'
                              data-placement='left'
                              title='Create a copy to use in your own sessions'>
                              {Meteor.user().hasGreaterRole('professor') ? 'Approve for course' : 'Copy to Library'}
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
                          </div>
                        : ''
                      }             
                      <div className='ql-preview-item-container'>
                        {this.state.selected
                          ? <QuestionDisplay question={this.state.questionMap[this.state.selected]} forReview readonly />
                          : ''
                        }
                      </div>
                    </div>
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
  
  const subscription = 'questions.' + props.library
  const handle =  Meteor.subscribe(subscription, props.courseId)
  const courseId = props.courseId
  
  
  let params = {}
  let editable = true
  
  if (props.library === 'library') {
    params = {
      query: {
        courseId: courseId,
        shared: false
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
        shared: false,
        courseId: courseId
      },
      options: {
        sort: { createdAt: -1 },
      }
    }
  }
  
  if (props.library === 'unapprovedFromStudents') {
    params = {
      query: {
        courseId: courseId,
        sessionId: {$exists: false},
        approved: false,
        shared: false,
        '$or': [{private: false}, {private: {$exists: false}}]
      },
      options: {sort:
        { createdAt: -1 },   
      }
    }
    editable = false
  }

  if (props.library === 'sharedWithUser') {
    params = {
      query: {
        shared: true
      },
      options: {sort:
        { createdAt: -1 },
      }
    }
    editable = false
  }

  const questions = Questions.find().fetch()
  const selected = questions[0] ? questions[0]._id : ''
  return {
    query: params,
    questions: questions,
    courseId: courseId,
    selected: selected,
    editable: editable,
    loading: !handle.ready()
  }
}, _QuestionsLibrary)
