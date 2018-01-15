// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx

import React from 'react'
import _ from 'underscore'

import { ControlledForm } from '../ControlledForm'

export const FORM_INPUTS = {
  name: '',
  deptCode: '',
  courseNumber: '',
  section: '',
  semester: ''
}

export const DEFAULT_STATE = Object.assign({}, FORM_INPUTS, {
  requireVerified: true,
  allowStudentQuestions: true
})

/**
 * modal dialog to prompt for course details
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class CreateCourseModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = _.extend({}, DEFAULT_STATE)
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for course form. Calls courses.insert
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    let course = _.extend({
      createdAt: new Date(),
      owner: Meteor.userId()
    }, this.state)

    if (Meteor.isTest) {
      this.props.done(course)
    }

    Meteor.call('courses.insert', course, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Course Created')
        this.done()
      }
    })
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.createcourseForm.reset()
    this.setState(_.extend({}, DEFAULT_STATE))
    super.done()
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-createcourse ql-card' onClick={this.preventPropagation}>
        <div className='ql-modal-header ql-header-bar'><h3>Create Course</h3></div>
        <form ref='createcourseForm' className='ql-form-createcourse ql-card-content' onSubmit={this.handleSubmit}>
          <label>Name:</label>
          <input type='text' className='form-control' data-name='name' onChange={this.setValue} placeholder='Calculus-based physics' /><br />

          <label>Department Code:</label>
          <input type='text' className='form-control uppercase' data-name='deptCode' onChange={this.setValue} placeholder='PHYS' /><br />

          <label>Course Number:</label>
          <input type='text' className='form-control' data-name='courseNumber' onChange={this.setValue} placeholder='123' /><br />

          <label>Section:</label>
          <input type='text' className='form-control' data-name='section' onChange={this.setValue} placeholder='001' /><br />

          <label>Semester:</label>
          <input type='text' className='form-control' data-name='semester' onChange={this.setValue} placeholder='F17' /><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end CreateCourseModal
