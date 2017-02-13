/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses.js'
import { Sessions } from '../../api/sessions.js'
import { CreateSessionModal } from '../modals/CreateSessionModal.jsx'

import { SessionListItem } from '../SessionListItem'
import { StudentListItem } from '../StudentListItem'

if (Meteor.isClient) import './manage_course.scss'

class _ManageCourse extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingSession: false }
    this.courseId = this.props.courseId

    this.sessions = {}
    this.students = {}
  }

  renderSessionList () {
    let sessions = this.props.course.sessions || []

    return (<div>
      <ul>
        { sessions.map((s) => {
          if (!this.sessions[s.sessionId]) return
          return (<SessionListItem key={s.sessionId} session={this.sessions[s.sessionId]} />)
        }) }
      </ul>
    </div>)
  }

  renderClassList () {
    let students = this.props.course.students || []

    return (<div>
      <ul>
        { students.map((s) => {
          if (!this.students[s.studentUserId]) return
          console.log(this.students[s.studentUserId])
          return (<StudentListItem key={s.studentUserId} courseId={this.courseId} student={this.students[s.studentUserId]} />)
        }) }
      </ul>
    </div>)
  }

  componentWillUpdate (nextProps) {
    nextProps.sessions.forEach((s) => {
      this.sessions[s._id] = s
    })
    nextProps.students.forEach((s) => {
      this.students[s._id] = s
    })
  }

  render () {
    const toggleCreatingSession = () => { this.setState({ creatingSession: !this.state.creatingSession }) }
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
              <button onClick={ toggleCreatingSession } >
                Create Session
              </button>
              { this.state.creatingSession ? 
                <CreateSessionModal courseId={this.courseId} done={toggleCreatingSession} /> 
                : '' }
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

export const ManageCourse = createContainer((props) => {
  const handle = Meteor.subscribe('courses') && Meteor.subscribe('sessions')  && Meteor.subscribe('userData')

  let course = Courses.find({ _id: props.courseId }).fetch()[0]
  let students = Meteor.users.find({ _id: { $in: _(course.students || []).pluck('studentUserId') } }).fetch()
  let sessions = Sessions.find({ _id: { $in: _(course.sessions || []).pluck('sessionId') } }).fetch()

  return {
    course: course,
    sessions: sessions,
    students: students,
    loading: !handle.ready()
  }
}, _ManageCourse)

