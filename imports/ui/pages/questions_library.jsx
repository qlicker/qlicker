// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions_library.jsx: page for managing and editing your own questions

//import React, { Component } from 'react'
import React, { Component, PropTypes } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'

import { questionLibraries } from '../pages/questions_nav'
import { QuestionEditItem } from '../QuestionEditItem'
import { QuestionDisplay } from '../QuestionDisplay'
import { QuestionSidebar } from '../QuestionSidebar'

import { Questions, defaultQuestion } from '../../api/questions'
//import { defaultQuestion } from '../../api/questions'
import { Courses } from '../../api/courses'

import { QUESTION_TYPE } from '../../configs'


export class _QuestionsLibrary extends Component {

  constructor (props) {
    super(props)


    this.state = {
      selectedQuestionId: null,
      resetSidebar: false, // only to trigger prop update of side bar when creating new question and thus clear the filter (used as toggle)
      questionMap: _(props.questions).indexBy('_id'),
    }
    /*
    if (this.props.selectedQuestion) {
      if (this.props.selectedQuestion) this.state.selectedQuestion = this.props.selectedQuestion
    }*/

    //this.convertField = this.convertField.bind(this)
    //this.exportQuestions = this.exportQuestions.bind(this)
    //this.importQuestions = this.importQuestions.bind(this)
    this.editQuestion = this.editQuestion.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
    this.approveQuestion = this.approveQuestion.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.makeQuestionPublic = this.makeQuestionPublic.bind(this)
    this.setFilter = this.setFilter.bind(this)
  }

  componentDidMount () {
    Meteor.call('courses.hasAllowedStudentQuestions', this.props.courseId, (e, allowed) => {
      if (e) alertify.error('Cannot get course permissions')
      else this.state.allowedStudentQuestions = allowed
    })
  }

  componentWillReceiveProps (newProps) {
    const newQuestions = newProps.questions
    if (!_.findWhere(newQuestions, {_id: this.state.selectedQuestionId})) {
      this.setState({ selectedQuestionId: null, questionMap: _(newQuestions).indexBy('_id') })
    } else this.setState({ questionMap: _(newQuestions).indexBy('_id')})

    //this.setState({questionMap: _(newProps.questions).indexBy('_id')})
    Meteor.call('courses.hasAllowedStudentQuestions', newProps.courseId, (e, allowed) => {
      if (e) alertify.error('Cannot get course permissions')
      else this.state.allowedStudentQuestions = allowed
    })

  }
/*
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
  }*/

  editQuestion (questionId) {
    if (questionId === -1) {
      // reset the query
      this.setState({/*query: this.props.query,*/ resetSidebar: true})
      const blankQuestion = _.extend(defaultQuestion, {
        owner: Meteor.userId(),
        creator: Meteor.userId(),
        approved: Meteor.user().isInstructor(this.props.courseId),
        courseId: this.props.courseId
      })
      Meteor.call('questions.insert', blankQuestion, (e, newQuestion) => {
        if (e) return alertify.error('Error: couldn\'t add new question')
        alertify.success('New Blank Question Added')
        this.setState({ selectedQuestionId: newQuestion._id })
      })

    } else { // TODO: why not just do it once???
      this.setState({ selectedQuestionId: null }, () =>{
        this.setState({ selectedQuestionId: questionId })
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
    //this.selectQuestion(null)
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
    //this.selectQuestion(null)
  }

  questionDeleted () {
    this.setState({ selectedQuestionId: null, resetSidebar: false })
  }

  setFilter (newState) {
    this.setState({ resetSidebar: newState})
  }



  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const user =  Meteor.user()
    const isInstructor = user.isInstructor(this.props.courseId)
    const isStudent = user.isStudent(this.props.courseId)
    let canEdit = true //whether the selected question can be edited
    let canCreate = true //whether user can create a new question
    let selectedQuestion = this.state.questionMap[this.state.selectedQuestionId]
    console.log(this.state.selectedQuestionId)
    console.log(this.state.questionMap)
    //only edit in course library
    if (this.props.questionLibrary === 'unapprovedFromStudents' || this.props.questionLibrary === 'public'){
      canEdit = false
      canCreate = false
    }
    //only edit if question exists...
    if (selectedQuestion) {
      //student cannot edit if course does not allow, or if it's approved, or if they are not the owner
      if( !isInstructor &&  (!this.state.allowedStudentQuestions || selectedQuestion.approved || !selectedQuestion.owner === Meteor.userId()) ){
        canEdit = false
      }
    } else { // can't edit if there is no questions
      canEdit = false
    }
    //can't create if not instructor or course does not allow student questions
    if (!isInstructor && !this.state.allowedStudentQuestions) {
      canCreate = false
    }

    return (
      <div>
        <div className='row'>
          <div className='col-md-4'>
            <br />
            { canCreate
              ? <div>
                  <button className='btn btn-primary' style={{'width':'100%'}} onClick={() => this.editQuestion(-1)}>New Question</button>
               </div>
              : ''
            }
            <QuestionSidebar
              questionLibrary={this.props.questionLibrary}
              courseId={this.props.courseId}
              onSelect={this.editQuestion}
              resetSidebar={this.state.resetSidebar}
              setFilter={this.setFilter}
              selected={selectedQuestion} />
          </div>
          <div className='col-md-8'>
          { selectedQuestion
              ? <div>
                {canEdit
                  ? <div>
                      <div id='ckeditor-toolbar' />
                      <div className='ql-edit-item-container'>
                        <QuestionEditItem
                          courseId={this.props.courseId}
                          question={selectedQuestion}
                          deleted={this.questionDeleted}
                          metadata autoSave />
                      </div>
                    </div>
                  : ''
                }

                  <h3>Preview Question</h3>
                  { this.props.questionLibrary !== 'library'
                    ? <div>
                        <button className='btn btn-default'
                          onClick={() => { this.approveQuestion(selectedQuestion) }}
                          data-toggle='tooltip'
                          data-placement='left'
                          title='Create a copy to use in your own sessions'>
                          {isInstructor ? 'Approve for course' : 'Copy to Library'}
                        </button>
                        { isInstructor ?
                           <button className='btn btn-default'
                              onClick={() => { this.makeQuestionPublic(selectedQuestion) }}
                              data-toggle='tooltip'
                              data-placement='left'
                              title='Make the question public'>
                              Make Public
                            </button>
                          : ''
                        }

                        <button className='btn btn-default'
                          onClick={() => { this.deleteQuestion(selectedQuestion) }}
                          data-toggle='tooltip'
                          data-placement='left'>
                            Delete
                        </button>
                      </div>
                    : ''
                  }
                  <div className='ql-preview-item-container'>
                    <QuestionDisplay question={selectedQuestion} forReview readonly />
                  </div>
                </div>
                : ''
              }
            </div>
          </div>
        </div>)
  }
}

export const QuestionsLibrary = createContainer((props) => {

  const subscription = 'questions.' + props.questionLibrary
  const handle =  Meteor.subscribe(subscription, props.courseId)
  const questions = Questions.find().fetch()
  return {
    loading: !handle.ready(),
    courseId: props.courseId,
    questionLibrary: props.questionLibrary,
    questions: questions
  }

}, _QuestionsLibrary)
