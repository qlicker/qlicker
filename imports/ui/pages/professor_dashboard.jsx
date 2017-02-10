// QLICKER
// Author: Enoch T <me@enocht.am>
//
// professor_dashboard.jsx: professor overview page

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { convertFromRaw } from 'draft-js'
import { stateToHTML } from 'draft-js-export-html'

import { CourseListItem } from '../CourseListItem'
import { CreateCourseModal } from '../modals/CreateCourseModal'

import { Courses } from '../../api/courses.js'
import { Questions } from '../../api/questions'

if (Meteor.isClient) import './professor_dashboard.scss'

class _ProfessorDashboard extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingCourse: false }

    this.doneCreatingCourse = this.doneCreatingCourse.bind(this)
    this.promptCreateCourse = this.promptCreateCourse.bind(this)
  }

  promptCreateCourse (e) {
    this.setState({ creatingCourse: true })
  }

  doneCreatingCourse (e) {
    this.setState({ creatingCourse: false })
  }

  renderCourseList () {
    // console.log('this.courses',this.props.courses)
    return this.props.courses.map((course) => (
      <CourseListItem key={course._id} course={course} />
    ))
  }

  render () {
    let courseList = <ul className='ui-courselist'>{this.renderCourseList()}</ul>

    return (
      <div className='container ui-professor-page'>
        <h2>My Courses</h2>
        <button onClick={this.promptCreateCourse}>Create Course</button>

        <hr />
        <ul className='ui-courselist'>
          { courseList }
        </ul>
        <div className='ui-modal-container' ref='modals'>
          { this.state.creatingCourse ? <CreateCourseModal done={this.doneCreatingCourse} /> : '' }
        </div>

        {
          this.props.questions.map(q => {
            const contentState = convertFromRaw(JSON.parse(q.content))
            return (<div dangerouslySetInnerHTML={{ __html: stateToHTML(contentState) }} ></div>)
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

