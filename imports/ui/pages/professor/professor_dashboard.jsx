// QLICKER
// Author: Enoch T <me@enocht.am>
//
// professor_dashboard.jsx: professor overview page

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'

import { CourseListItem } from '../../CourseListItem'
import { CreateCourseModal } from '../../modals/CreateCourseModal'

import { Courses } from '../../../api/courses.js'

class _ProfessorDashboard extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingCourse: false, edits: {} }

    this.doneCreatingCourse = this.doneCreatingCourse.bind(this)
    this.promptCreateCourse = this.promptCreateCourse.bind(this)
    this.deleteCourse = this.deleteCourse.bind(this)
  }

  promptCreateCourse (e) {
    this.setState({ creatingCourse: true })
  }

  doneCreatingCourse (e) {
    this.setState({ creatingCourse: false })
  }

  deleteCourse (courseId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.delete', courseId, (error) => {
        if (error) return alertify.error('Error deleting course')
        alertify.success('Course Deleted')
      })
    }
  }

  renderCourseList () {
    return this.props.courses.map((course) => (
      <CourseListItem
        key={course._id}
        course={course}
        click={() => Router.go('course', { _id: course._id })}
        controls={[{ label: 'Delete', click: () => this.deleteCourse(course._id) }]} />
    ))
  }

  render () {
    let courseList = <div className='ql-courselist'>{this.renderCourseList()}</div>

    return (
      <div className='container ql-professor-page'>
        <h1>Welcome to Qlicker</h1>

        <hr />
        <h2>Active Courses</h2>
        <button className='btn btn-default' onClick={this.promptCreateCourse}>Create Course</button>
        { courseList }

        <hr />
        <h2>Upcoming Sessions</h2>
        session list here

        {/* modals */}
        { this.state.creatingCourse ? <CreateCourseModal done={this.doneCreatingCourse} /> : '' }
      </div>)
  }

}

export const ProfessorDashboard = createContainer(() => {
  const handle = Meteor.subscribe('courses')

  return {
    courses: Courses.find({ owner: Meteor.userId() }).fetch(),
    loading: !handle.ready()
  }
}, _ProfessorDashboard)

