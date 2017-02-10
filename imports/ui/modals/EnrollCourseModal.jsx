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
        this.refs.enrollCourseForm.reset()
        this.setState({})
        this.props.done()
      }
    })
  }

  render () {
    return (
      <div className='ui-modal ui-modal-enrollcourse'>
        <form ref='enrollCourseForm' className='ui-form-enrollcourse' onSubmit={this.handleSubmit}>
          Department Code: <input type='text' data-name='deptCode' onChange={this.setValue} placeholder='CISC' /><br />
          Course Number: <input type='text' data-name='courseNumber' onChange={this.setValue} placeholder='498' /><br />
          Enrollment Code: <input type='text' data-name='enrollmentCode' onChange={this.setValue} placeholder='TCDHLZ' /><br />
          <input type='submit' />
        </form>
      </div>)
  } //  end render

} // end CreateCourseModal
