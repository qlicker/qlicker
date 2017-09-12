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
import { AddTAModal } from '../../modals/AddTAModal'
import { AddStudentModal } from '../../modals/AddStudentModal'
import { ProfileViewModal } from '../../modals/ProfileViewModal'

import { ROLES } from '../../../configs'

import { SessionListItem } from '../../SessionListItem'
import { StudentListItem } from '../../StudentListItem'

class _ManageCourse extends Component {

  constructor (props) {
    super(props)

    this.state = {
      creatingSession: false,
      copySessionModal: false,
      profileViewModal: false,
      addTAModal: false,
      addStudentModal: false,
      sessionToCopy: null,
      expandedClasslist: false,
      expandedSessionlist: false
    }
    this.toggleCopySessionModal = this.toggleCopySessionModal.bind(this)

    this.copySession = this.copySession.bind(this)
    this.deleteSession = this.deleteSession.bind(this)
    this.removeStudent = this.removeStudent.bind(this)
    //this.deleteCourse = this.deleteCourse.bind(this)
    //this.setActive = this.setActive.bind(this)
    this.toggleVerification = this.toggleVerification.bind(this)
    this.generateNewCourseCode = this.generateNewCourseCode.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
    this.toggleAllowStudentQuestions = this.toggleAllowStudentQuestions.bind(this)
  }

  toggleCopySessionModal (sessionId = null) {
    this.setState({ copySessionModal: !this.state.copySessionModal, sessionToCopy: sessionId })
  }

  toggleProfileViewModal (userToView = null) {
    this.setState({ profileViewModal: !this.state.profileViewModal, userToView: userToView })
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
/*
  deleteCourse () {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.delete', this.props.course._id, (error) => {
        if (error) return alertify.error('Error deleting course')
        alertify.success('Course Deleted')
        Router.go('courses')
      })
    }
  }

  setActive () {
    Meteor.call('courses.setActive', this.props.course._id, this.props.course.inactive || false, (error) => {
      if (error) return alertify.error('Error: could not set course property')
      alertify.success('Course set to: ' + (this.props.course.inactive ? 'Archived' : 'Active'))
    })
  }*/

  deleteSession (sessionId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.deleteSession', this.props.course._id, sessionId, (error) => {
        if (error) return alertify.error('Couldn\'t delete session')
        alertify.success('Session deleted')
      })
    }
  }

  removeStudent (studentUserId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.removeStudent',
        this.props.course._id,
        studentUserId,
        (error) => {
          if (error) return alertify.error('Error: couldn\'t remove student')
          alertify.success('Removed student')
        })
    }
  }

  removeTA (TAUserId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.removeTA',
        this.props.course._id,
        TAUserId,
        (error) => {
          if (error) return alertify.error('Error: couldn\'t remove TA')
          alertify.success('Removed TA')
        })
    }
  }

  toggleVerification () {
    Meteor.call('courses.setVerification', this.props.course._id, !this.props.course.requireVerified, (error) => {
      if (error) return alertify.error('Error: could not set course property')
      alertify.success('Email verification' + (this.props.course.requireVerified ? '' : ' not') + ' required')
    })
  }
  generateNewCourseCode (){
    if(confirm('Are sure?')){
      Meteor.call('courses.regenerateCode', this.props.course._id, (error) => {
        if (error) return alertify.error('Error: could not update enrollment code')
        alertify.success('Enrollment code updated')
      })
    }
  }
  toggleAllowStudentQuestions () {
    Meteor.call('courses.toggleAllowStudentQuestions', this.props.course._id, (error) => {
      if (error) return alertify.error('Error allowing/refusing student questions '+error.error)
      alertify.success('Students ' + (this.props.course.allowStudentQuestions ? 'can' : 'cannot') + ' submit questions')
    })
  }
  renderSessionList () {
    let sessions = this.props.sessions
    const statusSort = {hidden:2, visible:3, running:1, done:4}
    sessions = _(sessions).chain().sortBy( function(ses){
                   return ses.date
                 }).reverse().sortBy( function(ses){
                   return statusSort[ses.status]
                 }).value()

    const maxNum = 8
    const totalSessions = sessions.length
    if (!this.state.expandedSessionlist) sessions = sessions.slice(0, maxNum)
    const toggleExpandedSessionlist = () => { this.setState({ expandedSessionlist: !this.state.expandedSessionlist }) }
    const expandText = !this.state.expandedSessionlist ? 'Show all' : 'Show less'

    return (<div>
      {
        sessions.map((ses) => {
          if (!ses) return
          const sId = ses._id
          const nav = () => {
            if (ses.status === 'running') Router.go('session.run', { _id: sId })
            else Router.go('session.edit', { _id: sId })
          }
          const controls = []
          if (ses.status === 'running') {
            controls.push({
              label: 'Open Session Display',
              click: () => { window.open('/session/present/' + sId, 'Qlicker', 'height=768,width=1024') }
            })
            controls.push({ divider: true })
          }

          controls.push({ label: 'Review results', click: () => Router.go('/results/session/'+sId) })
          controls.push({ label: 'Duplicate', click: () => this.copySession(sId) })
          controls.push({ label: 'Copy to Course', click: () => this.toggleCopySessionModal(sId) })
          controls.push({ divider: true })
          controls.push({ label: 'Delete', click: () => this.deleteSession(sId) })

          return (<SessionListItem
            key={sId}
            session={ses}
            click={nav}
            controls={controls} />)
        })
      }
      { totalSessions > maxNum
        ? <a href='#' className='show-more-item' onClick={toggleExpandedSessionlist}>
          <div className='ql-list-item'>{expandText}</div>
        </a> : '' }
    </div>)
  }

  renderClassList () {
    uid = Meteor.userId()
    isProfOrAdmin = Meteor.user().hasGreaterRole('professor')
    let students = this.props.course.students || []
    //then sort alphabetically
    students = _(students).sortBy(function(id){
            return (this.props.students[id] ?
                    this.props.students[id].profile.lastname
                   :'0') }.bind(this))

    let TAs = this.props.course.instructors || []
    TAs = _(TAs).sortBy(function(id){
            return (this.props.TAs[id] ?
                    this.props.TAs[id].profile.lastname
                   :'0') }.bind(this))

    const maxNum = 8
    const totalStudents = students.length + TAs.length

    if (!this.state.expandedClasslist) students = students.slice(0, maxNum)
    const toggleExpandedClasslist = () => { this.setState({ expandedClasslist: !this.state.expandedClasslist }) }
    const expandText = !this.state.expandedClasslist ? 'Show all' : 'Show less'
    return (<div>
      {
        students.map((sId) => {
          const stu = this.props.students[sId]
          if (!stu) return
          let controls = [{ label: 'Remove student from course', click: () => this.removeStudent(sId) }]
          return (<StudentListItem
            key={sId}
            courseId={this.props.course._id}
            student={stu}
            click={() => this.toggleProfileViewModal(stu)}
            role='Student'
            controls={isProfOrAdmin? controls: ''} />)
        })
      }
      { //Cannot remove self, course owner cannot be removed by anyone
        TAs.map((sId) => {
          const TA = this.props.TAs[sId]
          if (!TA) return
          let controls = [{ label: 'Remove instructor from course', click: () => this.removeTA(sId) }]

          return (<StudentListItem
            key={sId}
            courseId={this.props.course._id}
            student={TA}
            click={() => this.toggleProfileViewModal(TA)}
            role={sId === this.props.course.owner ? 'Owner' : 'Instructor'}
            controls={(isProfOrAdmin && sId !== this.props.course.owner && sId !== uid ) ? controls: ''} />)
        })
      }
      { totalStudents > maxNum
        ? <a href='#' className='show-more-item' onClick={toggleExpandedClasslist}>
          <div className='ql-list-item'>{expandText}</div>
        </a> : '' }
    </div>)
  }

  render () {
    const toggleCreatingSession = () => { this.setState({ creatingSession: !this.state.creatingSession }) }
    const toggleAddTA = () => { this.setState({ addTAModal: !this.state.addTAModal }) }
    const toggleAddStudent = () => { this.setState({ addStudentModal: !this.state.addStudentModal }) }

    const strActive = this.props.course.inactive ? 'Enable Course' : 'Archive Course'
    return (
      <div className='container ql-manage-course'>
        <h2><span className='ql-course-code'>{this.props.course.courseCode()}</span> - {this.props.course.name}</h2>
        <br />
        <div className='row'>
          <div className='col-md-4'>

            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4>Course Details</h4>
              </div>
              <div className='ql-card-content'>
                {Meteor.user().hasGreaterRole(ROLES.prof) ? <div>
                  <div className='btn-group btn-group-justified details-button-group'>
                    <div className='btn btn-default' onClick={toggleAddTA}>Add Instructor/TA
                      { this.state.addTAModal ? <AddTAModal courseId={this.props.course._id} courseName= {this.props.course.courseCode()} done={toggleAddTA} /> : '' }
                    </div>
                    <div className='btn btn-default' onClick={toggleAddStudent}>Add Student
                      { this.state.addStudentModal ? <AddStudentModal courseId={this.props.course._id} courseName= {this.props.course.courseCode()} done={toggleAddStudent} /> : '' }
                    </div>
                  </div>
                  <div className='btn-group btn-group-justified details-button-group'>
                    <div className='btn btn-default' onClick={this.toggleVerification}>
                      {this.props.course.requireVerified ? 'Allow Unverified Email' : 'Require Verified Email'}
                    </div>
                  </div>
                  <div className='btn-group btn-group-justified details-button-group'>
                    <div className='btn btn-default' onClick={this.toggleAllowStudentQuestions}>
                      {this.props.course.allowStudentQuestions ? 'Disallow student questions' : 'Allow student questions'}
                    </div>
                  </div>
                </div> : ''
                }
                <div className='ql-course-details'>
                  <span className='ql-course-code'>{ this.props.course.fullCourseCode() } </span> -
                  <span className='ql-course-semester'> { this.props.course.semester }</span>
                  <br />
                  Enrollment Code: <span className='ql-enrollment-code'>{ this.props.course.enrollmentCode }</span>
                  &nbsp;&nbsp;<a href="#" onClick={this.generateNewCourseCode}>new</a>
                </div>
              </div>
            </div>

            <div className='ql-card hidden-xs'>
              <div className='ql-header-bar'>
                <h4>Classlist ({this.props.course.students.length} student{this.props.course.students.length>1?'s':''})</h4>
              </div>
              <div>
                <div className='ql-course-classlist'>
                  { this.renderClassList() }
                </div>
              </div>
            </div>

          </div>

          <div className='col-md-8'>
            <h3>Sessions ({this.props.sessions.length} session{this.props.sessions.length>1 ?'s':''})</h3>
            <div className='ql-session-list'>
              <div className='btn-group session-button-group'>
                <button className='btn btn-primary' onClick={toggleCreatingSession}>Create Session</button>
                <button className='btn btn-primary' onClick={() => { Router.go('course.results', { _id: this.props.course._id }) }}>Review Session Results</button>
              </div>
              { this.renderSessionList() }
            </div>
          </div>
        </div>

        {/* modals */}
        { this.state.creatingSession
          ? <CreateSessionModal isInstructor={this.props.isInstructor} courseId={this.props.course._id} done={toggleCreatingSession} />
          : '' }
        { this.state.copySessionModal
          ? <PickCourseModal
            selected={(courseId) => this.copySession(this.state.sessionToCopy, courseId)}
            done={this.toggleCopySessionModal} />
          : '' }
        { this.state.profileViewModal
          ? <ProfileViewModal
             user={this.state.userToView}
             done={this.toggleProfileViewModal}/>
        : '' }
      </div>)
  }

}

export const ManageCourse = createContainer((props) => {
  const handle = Meteor.subscribe('courses', {isInstructor: props.isInstructor}) &&
    Meteor.subscribe('sessions', {isInstructor: props.isInstructor}) &&
    Meteor.subscribe('users.myStudents', {cId: props.courseId}) &&
    Meteor.subscribe('users.myTAs', {cId: props.courseId})

  const course = Courses.find({ _id: props.courseId }).fetch()[0]

  const TAIds = course.instructors || []
  const TAs = Meteor.users.find({ _id: { $in: TAIds }, 'profile.roles': { $ne: 'admin' } }).fetch()

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  const sessionIds = course.sessions || []
  const sessions = Sessions.find({ _id: { $in: sessionIds } }, { sort: { date: -1 } }).fetch()

  return {
    course: course,
    sessions: sessions,
    students: _(students).indexBy('_id'),
    TAs: _(TAs).indexBy('_id'),
    loading: !handle.ready()
  }
}, _ManageCourse)
