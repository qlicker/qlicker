// QLICKER
// Author: Enoch T <me@enocht.am>
//
// professor_dashboard.jsx: professor overview page

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import CourseListItem from '../CourseListItem'
import { CreateCourseModal } from '../modals/CreateCourseModal'

import { Courses } from '../../api/courses.js'

import './professor_dashboard.scss'

class ProfessorDashboard extends Component {

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
        <h2>My Classes</h2>
        <button onClick={this.promptCreateCourse}>Create Course</button>

        <hr />
        <ul className='ui-courselist'>
          { courseList }
        </ul>
        <div className='ui-modal-container' ref='modals'>
          { this.state.creatingCourse ? <CreateCourseModal done={this.doneCreatingCourse} /> : '' }
        </div>

      </div>)
  }

}

export default createContainer(() => {
  const handle = Meteor.subscribe('courses')

  return {
    courses: Courses.find({ owner: Meteor.userId() }).fetch(),
    loading: !handle.ready()
  }
}, ProfessorDashboard)

