// QLICKER
// Author: Enoch T <me@enocht.am>
//
// professor_dashboard.jsx: professor overview page

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { DraftHelper } from '../../draft-helpers'

import { CourseListItem } from '../CourseListItem'
import { CreateCourseModal } from '../modals/CreateCourseModal'
import { CreateQuestionModal } from '../modals/CreateQuestionModal'

import { Courses } from '../../api/courses.js'
import { Questions } from '../../api/questions'

if (Meteor.isClient) import './professor_dashboard.scss'

class _ProfessorDashboard extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingCourse: false, edits: {} }

    this.doneCreatingCourse = this.doneCreatingCourse.bind(this)
    this.promptCreateCourse = this.promptCreateCourse.bind(this)
    this.editQuestion = this.editQuestion.bind(this)
  }

  promptCreateCourse (e) {
    this.setState({ creatingCourse: true })
  }

  doneCreatingCourse (e) {
    this.setState({ creatingCourse: false })
  }

  renderCourseList () {
    return this.props.courses.map((course) => (
      <CourseListItem key={course._id} course={course} />
    ))
  }
  editQuestion (questionId) {
    const e = _({}).extend(this.state.edits[questionId])
    e[questionId] = (questionId in this.state.edits) ? !this.state.edits[questionId] : true
    this.setState({ 
      edits: e
    })
  }
  render () {
    let courseList = <ul className='ql-courselist'>{this.renderCourseList()}</ul>

    return (
      <div className='container ql-professor-page'>
        <h2>My Courses</h2>
        <button className='btn btn-default' onClick={this.promptCreateCourse}>Create Course</button>

        <hr />
        { courseList }
        
        { this.state.creatingCourse ? <CreateCourseModal done={this.doneCreatingCourse} /> : '' }

        {
          this.props.questions.map(q => {
            return (<div key={q._id} >
                <div dangerouslySetInnerHTML={{ __html: DraftHelper.toHtml(q.content) }} onClick={() => this.editQuestion(q._id)}></div>
                { this.state.edits[q._id] ? <CreateQuestionModal courseId={q.courseId} done={() => this.editQuestion(q._id)} question={q} /> : '' }
              </div>)
          })
        }

      </div>)
  }

}

export const ProfessorDashboard = createContainer(() => {
  const handle = Meteor.subscribe('courses') && Meteor.subscribe('questions')

  return {
    courses: Courses.find({ owner: Meteor.userId() }).fetch(),
    questions: Questions.find({ }).fetch(),
    loading: !handle.ready()
  }
}, _ProfessorDashboard)

