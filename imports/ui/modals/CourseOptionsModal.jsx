// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore'

import { ControlledForm } from '../ControlledForm'

/**
 * modal dialog to prompt for course details
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class CourseOptionsModal extends ControlledForm {

  constructor (props) {
    super(props)
    const course = this.props.course
    this.state = {
      name: course.name,
      deptCode: course.deptCode,
      courseNumber: course.courseNumber,
      section: course.section,
      semester: course.semester,
      requireVerified: course.requireVerified ,
      allowStudentQuestions: course.allowStudentQuestions,
    }
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for course form. Calls courses.insert
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    let course = this.props.course
    const options = {
      name: this.state.name,
      deptCode: this.state.deptCode,
      courseNumber: this.state.courseNumber,
      section: this.state.section,
      semester: this.state.semester,
      requireVerified: this.state.requireVerified ,
      allowStudentQuestions: this.state.allowStudentQuestions,
    }
    course = _(course).extend(options)

    Meteor.call('courses.edit', course, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Course updated')
        this.done()
      }
    })
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.props.done()
  }

  render () {
  const toggleVerified = () => {this.setState({ requireVerified:!this.state.requireVerified })}
  const toggleAllowStudentQuestions = () => {this.setState({ allowStudentQuestions:!this.state.allowStudentQuestions })}

    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-createcourse ql-card' onClick={this.preventPropagation}>
        <div className='ql-modal-header ql-header-bar'><h3>Course options</h3></div>
        <form className='ql-form-createcourse ql-card-content' onSubmit={this.handleSubmit}>
          <label>Name:</label>
          <input type='text' className='form-control' data-name='name' onChange={this.setValue} value={this.state.name} /><br />

          <label>Department Code:</label>
          <input type='text' className='form-control uppercase' data-name='deptCode' onChange={this.setValue} value={this.state.deptCode} /><br />

          <label>Course Number:</label>
          <input type='text' className='form-control' data-name='courseNumber' onChange={this.setValue} value={this.state.courseNumber} /><br />

          <label>Section:</label>
          <input type='text' className='form-control' data-name='section' onChange={this.setValue} value={this.state.section} /><br />

          <label>Semester:</label>
          <input type='text' className='form-control' data-name='semester' onChange={this.setValue} value={this.state.semester} /><br />

          <input type='checkbox' data-name='requireVerified' onChange={toggleVerified} checked={this.state.requireVerified}/>
          <label>Require students to have a verifed email address to self-enroll </label> <br />

          <input type='checkbox' data-name='allowStudentQuestions' onChange={toggleAllowStudentQuestions} checked={this.state.allowStudentQuestions}/>
          <label>Allow students to submit questions to the course </label><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end courseoptions modal

CourseOptionsModal.propTypes = {
  done: PropTypes.func.isRequired,
  course: PropTypes.object.isRequired
}
