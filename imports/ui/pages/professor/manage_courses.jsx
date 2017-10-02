// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_courses.jsx: all courses (active & inactive) page

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { CourseListItem } from '../../CourseListItem'
import { CreateCourseModal } from '../../modals/CreateCourseModal'

import { Courses } from '../../../api/courses.js'

class _ManageCourses extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingCourse: false }

    this.doneCreatingCourse = this.doneCreatingCourse.bind(this)
    this.promptCreateCourse = this.promptCreateCourse.bind(this)
    this.deleteCourse = this.deleteCourse.bind(this)
  }

  deleteCourse (courseId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.delete', courseId, (error) => {
        if (error) return alertify.error('Error deleting course')
      })
    }
  }

  promptCreateCourse (e) {
    this.setState({ creatingCourse: true })
  }

  doneCreatingCourse (e) {
    this.setState({ creatingCourse: false })
    Meteor.setTimeout(this.forceUpdate, 500)
  }

  renderCourseList (cList) {
    return cList.map((course) => (
      <CourseListItem
        key={course._id}
        course={course}
        click={() => { Router.go('course', { _id: course._id }) }}
        controls={[{ label: 'Delete', click: () => this.deleteCourse(course._id) }]} />
    ))
  }

  render () {
    return (
      <div className='container ql-professor-page'>
        <h1>Courses</h1>
        <button className='btn btn-primary' onClick={this.promptCreateCourse}>Create Course</button>
        <div className='ql-courselist'>
          { this.renderCourseList(this.props.courses.filter((c) => !c.inactive)) }
        </div>
        <br /><br />
        <h2>Inactive Courses</h2>
        <div className='ql-courselist'>
          { this.renderCourseList(this.props.courses.filter((c) => c.inactive)) }
        </div>

        { this.state.creatingCourse ? <CreateCourseModal done={this.doneCreatingCourse} /> : '' }
      </div>)
  }
}

export const ManageCourses = createContainer(() => {
  const handle = Meteor.subscribe('courses')

  return {
    courses: Courses.find({ instructors: Meteor.userId() }).fetch(),
    loading: !handle.ready()
  }
}, _ManageCourses)
