/* global confirm  */
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

    this.removeStudent = this.removeStudent.bind(this)
    this.deleteSession = this.deleteSession.bind(this)
  }

  deleteSession (e) {
    if (confirm('Are you sure? Delete')) {
      Meteor.call('courses.deleteSession', this.props.course._id, e.target.getAttribute('key'), (error) => {
        if (error) {

        }
      })
    }
  }

  removeStudent (e) {
    if (confirm('Are you sure? Delete')) {
      Meteor.call('courses.removeStudent', this.props.course._id, e.target.dataset.studentId, (error) => {
        if (error) {

        }
      })
    }
  }

  renderSessionList () {
    let sessions = this.props.course.sessions || []
    return (<div>
      <ul>
        { sessions.map((s) => {
          return (<li key={s.sessionId} onClick={this.removeSession}>{JSON.stringify(s)}</li>)
        }) }
      </ul>
    </div>)
  }

  renderClassList () {
    let students = this.props.course.students || []
    return (<div>
      <ul>
        { students.map((s) => {
          return (<li data-student-id={s.studentUserId} onClick={this.removeStudent}>{s.studentUserId}</li>)
        }) }
      </ul>
    </div>)
  }

  render () {
    console.log(this.props.course)
    return (
      <div className='container ui-manage-course'>
        <h2>Manage course: {this.props.course.name} </h2>

        <div className='row'>
          <div className='columns six'>
            <h3>Course Details</h3>
            <div className='ui-course-details'>
              <span className='ui-course-code'>{ this.props.course.createCourseCode() } </span>
              <span className='ui-course-semester'>{ this.props.course.semester }</span>
              <br />
              Enrollment Code: <span className='ui-enrollment-code'>{ this.props.course.enrollmentCode }</span>
            </div>

            <h3>Sessions</h3>
            <div className='ui-session-list'>
              { this.renderSessionList() }
            </div>

          </div>

          <div className='columns six'>
            <h3>Class List</h3>
            <div className='ui-course-classlist'>
              { this.renderClassList() }
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

