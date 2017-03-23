// QLICKER
// Author: Enoch T <me@enocht.am>
//
// student_dashboard.jsx: student overview page

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../../api/courses.js'
import { EnrollCourseModal } from '../../modals/EnrollCourseModal'
import { StudentCourseComponent } from '../../StudentCourseComponent'

class _StudentDashboard extends Component {
  constructor (props) {
    super(props)

    this.state = { enrollingInCourse: false, showResendLink: true }

    this.promptForCode = this.promptForCode.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.renderCourseList = this.renderCourseList.bind(this)
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
  }

  sendVerificationEmail () {
    Meteor.call('users.sendVerificationEmail', (e) => {
      if (e) alertify.error('Error sending email')
      else this.setState({ showResendLink: false })
    })
  }

  promptForCode () {
    this.setState({ enrollingInCourse: true })
  }
  closeModal () {
    this.setState({ enrollingInCourse: false })
    this.forceUpdate()
    // this.props.handle.invalidate()
  }

  renderCourseList () {
    return this.props.courses.map((c) => (<StudentCourseComponent key={c._id} course={c} sessionRoute='session' />))
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const needsEmailVerification = !Meteor.user().emails[0].verified
    return (
      <div className='container ql-student-page'>
        <div className='messages'>
          { needsEmailVerification
            ? <div className='alert alert-warning' role='alert' >
              To enroll in some courses, you may need to verify your email. &nbsp;&nbsp;&nbsp;
              { this.state.showResendLink ? <a href='#' onClick={this.sendVerificationEmail}>Resend Email</a> : 'Check your email' }
            </div>
            : '' }
        </div>
        <button className='btn btn-primary' onClick={this.promptForCode}>Enroll in Course</button>
        <div className='ql-courselist'>
          { this.renderCourseList() }
        </div>
        { this.state.enrollingInCourse ? <EnrollCourseModal done={this.closeModal} /> : '' }

      </div>)
  }
}

export const StudentDashboard = createContainer(() => {
  const handle = Meteor.subscribe('courses') && Meteor.subscribe('userData')
  const user = Meteor.users.findOne(Meteor.userId())
  const cArr = user.profile.courses || []

  return {
    courses: Courses.find({ _id: { $in: cArr }, inactive: { $in: [null, false] } }).fetch(),
    loading: !handle.ready(),
    handle: handle
  }
}, _StudentDashboard)
