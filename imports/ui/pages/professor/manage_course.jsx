/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../../api/courses'
import { Sessions } from '../../../api/sessions'
import { CreateSessionModal } from '../../modals/CreateSessionModal'

import { SessionListItem } from '../../SessionListItem'
import { StudentListItem } from '../../StudentListItem'

class _ManageCourse extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingSession: false }
    this.courseId = this.props.courseId
    this.deleteSession = this.deleteSession.bind(this)
    this.removeStudent = this.removeStudent.bind(this)
  }

  deleteSession (sessionId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.deleteSession', this.courseId, sessionId, (error) => {
        if (error) return alertify.error('Couldn\'t delete session')
        alertify.success('Delete session')
      })
    }
  }

  removeStudent (studentUserId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.removeStudent',
        this.courseId,
        studentUserId,
        (error) => {
          if (error) return alertify.error('Error: couldn\'t remove student')
          alertify.success('Removed student')
        })
    }
  }

  renderSessionList () {
    let sessions = this.props.course.sessions || []

    return (<div>
      {
        sessions.map((sId) => {
          const ses = this.props.sessions[sId]
          const nav = () => { Router.go('session.edit', { _id: sId }) }
          if (!ses) return
          return (<SessionListItem
            key={sId}
            session={ses}
            click={nav}
            controls={[{ label: 'Delete', click: () => this.deleteSession(sId) }]} />)
        })
      }
    </div>)
  }

  renderClassList () {
    let students = this.props.course.students || []

    return (<div>
      {
        students.map((s) => {
          const stu = this.props.students[s]
          if (!stu) return
          return (<StudentListItem
            key={s}
            courseId={this.courseId}
            student={stu}
            controls={[{ label: 'Delete', click: () => this.removeStudent(s) }]} />)
        })
      }
    </div>)
  }

  render () {
    const toggleCreatingSession = () => { this.setState({ creatingSession: !this.state.creatingSession }) }

    return (
      <div className='container ql-manage-course'>
        <h2>Course: {this.props.course.name} </h2>

        <div className='row'>
          <div className='col-md-4'>
            <br />
            <h3>Course Details</h3>
            <div className='ql-course-details'>
              <span className='ql-course-code'>{ this.props.course.fullCourseCode() } </span>
              <span className='ql-course-semester'>{ this.props.course.semester }</span>
              <br />
              Enrollment Code: <span className='ql-enrollment-code'>{ this.props.course.enrollmentCode }</span>
            </div>

            <br />

            <h3>Class List</h3>
            <div className='ql-course-classlist'>
              { this.renderClassList() }
            </div>

          </div>

          <div className='col-md-8'>
            <h3>Sessions</h3>
            <div className='ql-session-list'>
              <button className='btn btn-default' onClick={toggleCreatingSession}>Create Session</button>

              { this.renderSessionList() }
            </div>
          </div>
        </div>

        {/* modals */}
        { this.state.creatingSession
          ? <CreateSessionModal courseId={this.courseId} done={toggleCreatingSession} />
          : '' }
      </div>)
  }

}

export const ManageCourse = createContainer((props) => {
  const handle = Meteor.subscribe('courses') &&
    Meteor.subscribe('sessions') &&
    Meteor.subscribe('userData')

  const course = Courses.find({ _id: props.courseId }).fetch()[0]

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  const sessionIds = course.sessions || []
  const sessions = Sessions.find({ _id: { $in: sessionIds } }).fetch()

  return {
    course: course,
    sessions: _(sessions).indexBy('_id'),
    students: _(students).indexBy('_id'),
    loading: !handle.ready()
  }
}, _ManageCourse)

