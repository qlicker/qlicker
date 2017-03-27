// QLICKER
// Author: Enoch T <me@enocht.am>
//
// EnrollCourseModal.jsx: popup dialog to prompt for course Enrollment details

import React from 'react'

import { ControlledForm } from '../ControlledForm'

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

    Meteor.call('courses.checkAndEnroll', this.state.enrollmentCode, (error) => {
      if (error) alertify.error('Error: ' + error.message)
      else {
        alertify.success('Enrolled Sucessfully')
        this.done()
      }
    })
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-enrollcourse container' onClick={this.preventPropagation}>
        <h2>Enroll In Course</h2>
        <form ref='enrollCourseForm' className='ql-form-enrollcourse' onSubmit={this.handleSubmit}>

          <label>Enrollment Code:</label>
          <input type='text' className='form-control' data-name='enrollmentCode' onChange={this.setValue} placeholder='TCDHLZ' /><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end EnrollCourseModal


