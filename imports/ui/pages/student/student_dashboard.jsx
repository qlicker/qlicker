// QLICKER
// Author: Enoch T <me@enocht.am>
//
// student_dashboard.jsx: student overview page

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../../api/courses.js'

import { StudentCourseComponent } from '../../StudentCourseComponent'

class _StudentDashboard extends Component {
  constructor (props) {
    super(props)

    this.state = { enrollingInCourse: false, showResendLink: true }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.renderCourseList = this.renderCourseList.bind(this)
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
  }

  sendVerificationEmail () {
    Meteor.call('users.sendVerificationEmail', (e) => {
      if (e) alertify.error('Error sending email')
      else this.setState({ showResendLink: false })
    })
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for enroll form. Calls courses.checkAndEnroll
   */
  handleSubmit (e) {
    e.preventDefault()

    if (!this.state.enrollmentCode) return alertify.error('Please enter a 6 digit enrollment code')

    Meteor.call('courses.checkAndEnroll', this.state.enrollmentCode, (error) => {
      if (error) alertify.error('Error: ' + error.message)
      else {
        alertify.success('Enrolled Sucessfully')
        this.setState({ enrollmentCode: undefined })
        this.refs.enrollCourseForm.reset()
      }
    })
  }

  renderCourseList ( clist ) {
    return clist.map((c) =>{
      return c.inactive ?
         (<StudentCourseComponent key={c._id} course={c} inactive />)
       : (<StudentCourseComponent key={c._id} course={c} sessionRoute='session' />)
     })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const needsEmailVerification = !Meteor.user().emails[0].verified
    const activeCourses = this.props.courses.filter((c) => !c.inactive)
    const inactiveCourses = this.props.courses.filter((c) => c.inactive)


    const setEnrollmentCode = (e) => { this.setState({ enrollmentCode: e.target.value }) }
    return (
      <div className='container ql-student-page'>
        <div className='messages'>
          { needsEmailVerification
            ? <div className='alert alert-warning' role='alert' >
              To enroll in some courses, you may need to verify your email. &nbsp;&nbsp;
              { this.state.showResendLink ? <span>If you didn't recieve an email: <a href='#' onClick={this.sendVerificationEmail}>Click to Resend Email</a></span> : 'Check your email' }
            </div>
            : '' }
        </div>
        <form ref='enrollCourseForm' onSubmit={this.handleSubmit}>
          <div className='form-flex'>
            <input type='text' onChange={setEnrollmentCode} className='form-control uppercase' placeholder='Enrollment Code' />
            <button type='submit' className='btn btn-primary'>Enroll in Course</button>
          </div>
        </form>
        <div className='ql-courselist'>
          { this.renderCourseList(activeCourses) }
        </div>
        { inactiveCourses.length > 0 ?
          <div>
            <br /><br /><br /><br />
            <h2>Inactive courses</h2>
            <div className='ql-courselist'>
              { this.renderCourseList(inactiveCourses) }
            </div>
          </div>
          : ''
        }

      </div>)
  }
}

export const StudentDashboard = createContainer(() => {
  const handle = Meteor.subscribe('courses')
  const courses = Courses.find({ students: Meteor.userId() }).fetch()

  return {
    courses: courses,
    loading: !handle.ready(),
    handle: handle
  }
}, _StudentDashboard)
