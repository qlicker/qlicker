// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx: popup dialog to prompt for course details

import React, { Component } from 'react'

export class EnrollCourseModal extends Component {

  constructor (props) {
    super(props)

    this.state = {}

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  handleSubmit (e) {
    e.preventDefault()

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
      <div className='ui-modal ui-modal-createcourse'>
        <form ref='enrollCourseForm' className='ui-form-createcourse' onSubmit={this.handleSubmit}>
          Department Code: <input type='text' data-name='deptCode' onChange={this.setValue} placeholder='CISC' /><br />
          Course Number: <input type='text' data-name='courseNumber' onChange={this.setValue} placeholder='498' /><br />
          Enrollment Code: <input type='text' data-name='enrollmentCode' onChange={this.setValue} placeholder='TCDHLZ' /><br />
          <input type='submit' />
        </form>
      </div>)
  } //  end render

} // end CreateCourseModal
