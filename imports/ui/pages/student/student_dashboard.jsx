// QLICKER
// Author: Enoch T <me@enocht.am>
//
// student_dashboard.jsx: student overview page

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../../api/courses.js'
import { EnrollCourseModal } from '../../modals/EnrollCourseModal'
import { CourseListItem } from '../../CourseListItem'

class _StudentDashboard extends Component {
  constructor (props) {
    super(props)

    this.state = { enrollingInCourse: false }

    this.promptForCode = this.promptForCode.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.renderCourseList = this.renderCourseList.bind(this)
  }

  promptForCode () {
    this.setState({ enrollingInCourse: true })
  }
  closeModal () {
    this.setState({ enrollingInCourse: false })
    // this.props.handle.invalidate()
  }

  renderCourseList () {
    return this.props.courses.map((c) => (<CourseListItem key={c._id} course={c} />))
  }

  render () {
    return (
      <div className='container ql-student-page'>
        <h2>My Courses</h2>
        <button className='btn btn-default' onClick={this.promptForCode}>Enroll in Course</button>

        <hr />
        <ul>
          { this.renderCourseList() }
        </ul>
        { this.state.enrollingInCourse ? <EnrollCourseModal done={this.closeModal} /> : '' }

      </div>)
  }
}

export const StudentDashboard = createContainer(() => {
  const handle = Meteor.subscribe('courses')
  const cArr = Meteor.user().profile.courses || []
  return {
    courses: Courses.find({ _id: { $in: cArr } }).fetch(),
    loading: !handle.ready(),
    handle: handle
  }
}, _StudentDashboard)
