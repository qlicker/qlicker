// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions_library.jsx: page for managing and editing your own questions

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'

import { questionLibraries } from '../pages/questions_nav'
import { QuestionEditItem } from '../QuestionEditItem'
import { QuestionDisplay } from '../QuestionDisplay'
import { QuestionSidebar } from '../QuestionSidebar'

import { defaultQuestion } from '../../api/questions'
import { Courses } from '../../api/courses'

class _QuestionsLibrary extends Component {

  constructor (props) {
    super(props)
   
    this.state = {
      edits: {},
      selected: null,
      questions: props.questions,
      query: props.query,
      resetSidebar: false // only to trigger prop update of side bar when creating new question and thus clear the filter (used as toggle)
    }
    if (this.props.selected) {
      if (this.props.selected) this.state.selected = this.props.selected
    }
  
    this.convertField = this.convertField.bind(this)
    this.exportQuestions = this.exportQuestions.bind(this)
    this.importQuestions = this.importQuestions.bind(this)
    this.editQuestion = this.editQuestion.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
    this.approveQuestion = this.approveQuestion.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.makeQuestionPublic = this.makeQuestionPublic.bind(this)
    this.setFilter = this.setFilter.bind(this)

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

  editQuestion (question) {
    if (question === null) {
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
          this.setState({ selected: newQuestion })
        })
      })
    } else {
      this.setState({ selected: null }, () => {
        this.setState({ selected: question })
      })
    }
  }

  approveQuestion (question) {
    let user = Meteor.user()
    if (user.hasRole('student')) {
      question.approved = false
    }
    else question.approved = true
    delete question._id
    question.public = false
    question.owner = Meteor.userId()
    question.createdAt = new Date()
    question.courseId = this.props.courseId
    question.sharedCopy = false
    Meteor.call('questions.insert', question, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question copied to library')
    })
    
  }

  deleteQuestion (question) {
    Meteor.call('questions.delete', question._id, (error) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Deleted')
      this.questionDeleted()
    })
  }

  makeQuestionPublic (question) {
   // by making it public, you take over ownership, so student cannot delete it anymore
   // it will also show in the library for any instructor of the course
    question.approved = true // this makes it editable by any instructor of the course

    question.public = true
    question.owner = Meteor.userId()
    question.createdAt = new Date()
    Meteor.call('questions.update', question, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question moved to public area')
    })
    
  }

  questionDeleted () {
    this.setState({ selected: null, resetSidebar: false })
  }

  setFilter (newState) {
    this.setState({ resetSidebar: newState})
  }

  componentDidMount () {
    this.forceUpdate
  }
  
  render () {

    const isInstructor = Meteor.user().isInstructorAnyCourse()
   
    return (
      <div>
        <div className='row'>
          <div className='col-md-4'>
            <br />
            {(isInstructor || this.state.allowedStudentQuestions) && this.props.questionLibrary === 'library'
              ? <div>
                  <button className='btn btn-primary' style={{'width':'100%'}} onClick={() => this.editQuestion(null)}>New Question</button>
                  <div className='ql-questions-library ql-sidebar-buttons'>                  
                    <button className='btn btn-primary' onClick={this.exportQuestions}>Export to File</button>
                    <label className='btn btn-primary'>
                      <input style={{'display' : 'none'}} type='file' onChange={this.importQuestions} />
                      Import from File
                    </label>
                  </div>
                </div>
                : ''}
            <QuestionSidebar
              questionLibrary={this.props.questionLibrary}
              courseId={this.props.courseId}
              onSelect={this.editQuestion}
              resetSidebar={this.state.resetSidebar}
              setFilter={this.setFilter}
              selected={this.state.selected} />
          </div>
          <div className='col-md-8'>
            { this.state.selected
            ? <div>
                {(isInstructor || this.state.allowedStudentQuestions) && this.props.editable && (isInstructor || !this.state.selected.approved)
                  ? <div>
                      <div id='ckeditor-toolbar' />
                      <div className='ql-edit-item-container'>
                    
                        <QuestionEditItem
                          courseId={this.props.courseId}
                          publicQuestionsRequireApproval={this.props.publicQuestionsRequireApproval}
                          question={this.state.selected}
                          deleted={this.questionDeleted}
                          metadata autoSave />
                      </div>
                    </div>
                  : <div>
                      <h3>Preview Question</h3>
                      { this.props.questionLibrary !== 'library'
                        ? <div>
                            <button className='btn btn-default'
                              onClick={() => { this.approveQuestion(this.state.selected) }}
                              data-toggle='tooltip'
                              data-placement='left'
                              title='Create a copy to use in your own sessions'>
                              {Meteor.user().hasGreaterRole('professor') ? 'Approve for course' : 'Copy to Library'}
                            </button>
                            { !Meteor.user().hasRole('student') 
                              ? <button className='btn btn-default'
                                  onClick={() => { this.makeQuestionPublic(this.state.selected) }}
                                  data-toggle='tooltip'
                                  data-placement='left'
                                  title='Make the question public'>
                                  Make Public
                                </button>
                              : ''
                            }
                            
                            <button className='btn btn-default'
                              onClick={() => { this.deleteQuestion(this.state.selected) }}
                              data-toggle='tooltip'
                              data-placement='left'>
                                Delete
                            </button>
                          </div>
                        : ''
                      }             
                      <div className='ql-preview-item-container'>
                        {this.state.selected
                          ? <QuestionDisplay question={this.state.selected} forReview readonly />
                          : ''
                        }
                      </div>
                    </div>
                }
                <div className='ql-preview-item-container'>
                  {this.state.selected
                    ? <QuestionDisplay question={this.state.selected} forReview readonly />
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
  
  const courseId = props.courseId
  
  let editable = true
  
  if (props.questionLibrary === 'unapprovedFromStudents' || props.questionLibrary === 'sharedWithUser') {
    editable = false
  }
  
  const course = Courses.findOne({ _id: props.courseId })
  const publicQuestionsRequireApproval = course.requireApprovedPublicQuestions
 
  return {
    courseId: courseId,
    publicQuestionsRequireApproval: publicQuestionsRequireApproval,
    selected: null,
    editable: editable,
    questionLibrary: props.questionLibrary
  }
}, _QuestionsLibrary)
