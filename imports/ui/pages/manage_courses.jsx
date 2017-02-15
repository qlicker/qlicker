// QLICKER
// Author: Enoch T <me@enocht.am>
//
// professor_dashboard.jsx: professor overview page

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { CourseListItem } from '../CourseListItem'
import { CreateCourseModal } from '../modals/CreateCourseModal'

import { Courses } from '../../api/courses.js'

// if (Meteor.isClient) import './.scss'

class _ManageCourses extends Component {

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
    return this.props.courses.map((course) => (
      <CourseListItem key={course._id} course={course} />
    ))
  }

  render () {
    let courseList = <ul className='ql-courselist'>{this.renderCourseList()}</ul>

    return (
      <div className='container ql-professor-page'>
        <h2>Courses</h2>
        <button className='btn btn-default' onClick={this.promptCreateCourse}>Create Course</button>
        { courseList }

        { this.state.creatingCourse ? <CreateCourseModal done={this.doneCreatingCourse} /> : '' }
      </div>)
  }

}

export const ManageCourses = createContainer(() => {
  const handle = Meteor.subscribe('courses')

  return {
    courses: Courses.find({ owner: Meteor.userId() }).fetch(),
    loading: !handle.ready()
  }
}, _ManageCourses)

