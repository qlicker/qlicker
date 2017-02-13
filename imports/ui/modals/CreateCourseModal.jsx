// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx: popup dialog to prompt for course details

import React, { Component } from 'react'
import _ from 'underscore'

import { ControlledForm } from './ControlledForm'

if (Meteor.isClient) import './CreateCourseModal.scss'

export const DEFAULT_STATE = {
  name: '',
  deptCode: '',
  courseNumber: '',
  section: '',
  semester: ''
}

export class CreateCourseModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = _.extend({}, DEFAULT_STATE)
  }

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

  done (e) {
    this.refs.createcourseForm.reset()
    this.setState(_.extend({}, DEFAULT_STATE))
    super.done()
  }

  render () {
    return (<div className='ui-modal-container' onClick={this.done}>
        <div className='ui-modal ui-modal-createcourse container' onClick={this.preventPropagation}>
          <h2>Create Course</h2>
          <form ref='createcourseForm' className='ui-form-createcourse' onSubmit={this.handleSubmit}>
            Name: <input type='text' data-name='name' onChange={this.setValue} placeholder='Information Technology Project (2016-17)' /><br />
            Department Code: <input type='text' data-name='deptCode' onChange={this.setValue} placeholder='CISC' /><br />
            Course Number: <input type='text' data-name='courseNumber' onChange={this.setValue} placeholder='498' /><br />
            Section: <input type='text' data-name='section' onChange={this.setValue} placeholder='001' /><br />
            Semester: <input type='text' data-name='semester' onChange={this.setValue} placeholder='W17' /><br />
            <input type='submit' />
          </form>
        </div>
      </div>)
  } //  end render

} // end CreateCourseModal
