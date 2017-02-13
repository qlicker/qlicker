// QLICKER
// Author: Enoch T <me@enocht.am>
//
// EnrollCourseModal.jsx: popup dialog to prompt for course Enrollment details

import React, { Component } from 'react'

import { ControlledForm } from './ControlledForm'

export const DEFAULT_STATE = {
  deptCode: '',
  courseNumber: '',
  enrollmentCode: ''
}

export class EnrollCourseModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = {}
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.enrollCourseForm.reset()
    this.setState({})
    this.props.done()
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for enroll form. Calls courses.checkAndEnroll
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    Meteor.call('courses.checkAndEnroll', this.state.deptCode, this.state.courseNumber, this.state.enrollmentCode, (error) => {
      if (error) {
        console.log(error)
        if (error.error === 'not-authorized') {
          // TODO
        } else if (error.error === 400) {
          // check didnt pass
        }
      } else {
        // Reset
        this.done()
      }
    })
  }

  render () {
    return (<div className='ui-modal-container' onClick={this.done}>
      <div className='ui-modal ui-modal-enrollcourse container' onClick={this.preventPropagation}>
        <h2>Enroll In Course</h2>
        <form ref='enrollCourseForm' className='ui-form-enrollcourse' onSubmit={this.handleSubmit}>
          Department Code: <input type='text' data-name='deptCode' onChange={this.setValue} placeholder='CISC' /><br />
          Course Number: <input type='text' data-name='courseNumber' onChange={this.setValue} placeholder='498' /><br />
          Enrollment Code: <input type='text' data-name='enrollmentCode' onChange={this.setValue} placeholder='TCDHLZ' /><br />
          <input type='submit' />
        </form>
      </div>
    </div>)
  } //  end render

} // end CreateCourseModal
