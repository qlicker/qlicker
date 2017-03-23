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
import { PickCourseModal } from '../../modals/PickCourseModal'

import { SessionListItem } from '../../SessionListItem'
import { StudentListItem } from '../../StudentListItem'

class _ManageCourse extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingSession: false, copySessionModal: false, sessionToCopy: null }
    this.toggleCopySessionModal = this.toggleCopySessionModal.bind(this)

    this.courseId = this.props.courseId
    this.copySession = this.copySession.bind(this)
    this.deleteSession = this.deleteSession.bind(this)
    this.removeStudent = this.removeStudent.bind(this)
    this.deleteCourse = this.deleteCourse.bind(this)
    this.setActive = this.setActive.bind(this)
  }

  toggleCopySessionModal (sessionId = null) {
    this.setState({ copySessionModal: !this.state.copySessionModal, sessionToCopy: sessionId })
  }

  copySession (sessionId, courseId = null) {
    Meteor.call('sessions.copy', sessionId, courseId, (error) => {
      if (error) return alertify.error('Error copying session')
      alertify.success('Session copied')
      if (courseId) {
        this.toggleCopySessionModal()
        Router.go('course', { _id: courseId })
      }
    })
  }

  deleteCourse () {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.delete', this.courseId, (error) => {
        if (error) return alertify.error('Error deleting course')
        alertify.success('Course Deleted')
        Router.go('courses')
      })
    }
  }

  setActive () {
    Meteor.call('courses.setActive', this.courseId, this.props.course.inactive || false, (error) => {
      if (error) return alertify.error('Error: could not set course property')
      alertify.success('Course set to: ' + (this.props.course.inactive ? 'Archived' : 'Active'))
    })
  }

  deleteSession (sessionId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.deleteSession', this.courseId, sessionId, (error) => {
        if (error) return alertify.error('Couldn\'t delete session')
        alertify.success('Session deleted')
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
            controls={[
              { label: 'Delete', click: () => this.deleteSession(sId) },
              { label: 'Duplicate', click: () => this.copySession(sId) },
              { label: 'Copy to Course', click: () => this.toggleCopySessionModal(sId) }
            ]} />)
        })
      }
    </div>)
  }

  renderClassList () {
    let students = this.props.course.students || []

    return (<div>
      {
        students.map((sId) => {
          const stu = this.props.students[sId]
          if (!stu) return
          return (<StudentListItem
            key={sId}
            courseId={this.courseId}
            student={stu}
            controls={[
              { label: 'Delete', click: () => this.removeStudent(sId) }
            ]} />)
        })
      }
    </div>)
  }

  render () {
    const toggleCreatingSession = () => { this.setState({ creatingSession: !this.state.creatingSession }) }

    const strActive = this.props.course.inactive ? 'Enable Course' : 'Archive Course'
    return (
      <div className='container ql-manage-course'>
        <h2><span className='ql-course-code'>{this.props.course.courseCode()}</span> - {this.props.course.name}</h2>

        <div className='row'>
          <div className='col-md-4'>
            <br />
            <h3>Course Details</h3>
            <button className='btn btn-default' onClick={this.deleteCourse}>Delete</button>
            <button className='btn btn-default' onClick={this.setActive}>{strActive}</button>
            <div className='ql-course-details'>
              <span className='ql-course-code'>{ this.props.course.fullCourseCode() } </span> -
              <span className='ql-course-semester'> { this.props.course.semester }</span>
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
            <br />
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
        { this.state.copySessionModal
          ? <PickCourseModal
            selected={(courseId) => this.copySession(this.state.sessionToCopy, courseId)}
            done={this.toggleCopySessionModal} />
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

