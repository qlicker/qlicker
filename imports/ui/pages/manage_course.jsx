// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses.js'

import './manage_course.scss'

class ManageCourse extends Component {

  constructor (props) {
    super(props)

    this.state = { }
  }

  renderSessionList () {
    return (<div>sessions...</div>)
  }

  render () {
    console.log(this.props.course)
    return (
      <div className='container ui-manage-course'>
        <h2>Manage course: {this.props.course.name} </h2>

        <div className='row'>
          <div className='columns six'>
            <div className='ui-course-details'>
              <h3>Course Details</h3>
              <span className='ui-course-code'>{ this.props.course.createCourseCode() } </span>
              <span className='ui-course-semester'>{ this.props.course.semester }</span>
              <br />
              Enrollment Code: <span className='ui-enrollment-code'>{ this.props.course.enrollmentCode }</span>
            </div>
          </div>

          <div className='columns six'>
            <div className='ui-course-sessions'>
              <h3>Sessions</h3>
              <div className='ui-session-list'>
                { this.renderSessionList() }
              </div>
            </div>
          </div>
        </div>

      </div>)
  }

}

export default createContainer((props) => {
  const handle = Meteor.subscribe('courses')

  return {
    course: Courses.find({ _id: props.courseId }).fetch()[0],
    loading: !handle.ready()
  }
}, ManageCourse)

