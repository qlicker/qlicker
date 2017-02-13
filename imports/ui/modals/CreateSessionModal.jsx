// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx: popup dialog to prompt for course details

import React, { Component } from 'react'
import _ from 'underscore'

import { ControlledForm } from './ControlledForm'

// if (Meteor.isClient) import './CreateCourseModal.scss'

export const DEFAULT_STATE = {
  name: '',
  description: '',
  courseId: '',
  quiz: false,
  dueDate: undefined
}

export class CreateSessionModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = _.extend({}, DEFAULT_STATE)
  }

  setValue (e) {
    let stateEdits = {}
    let key = e.target.dataset.name
    if (key === 'quiz') stateEdits[e.target.dataset.name] = (e.target.value === 'true')
    else stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  handleSubmit (e) {
    super.handleSubmit(e)

    let session = _.extend({
      createdAt: new Date(),
      courseId: this.props.courseId
    }, this.state)

    if (Meteor.isTest) {
      this.props.done(session)
    }

    Meteor.call('courses.createSession', this.props.courseId, session, (error) => {
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
    this.refs.createSessionForm.reset()
    this.setState(_.extend({}, DEFAULT_STATE))
    super.done()
  }

  render () {
    return (<div className='ui-modal-container' onClick={this.done}>
      <div className='ui-modal ui-modal-createsession container' onClick={this.preventPropagation}>
        <h2>Create Session</h2>
        <form ref='createSessionForm' className='ui-form-createsession' onSubmit={this.handleSubmit}>
          Name: <input type='text' data-name='name' onChange={this.setValue} placeholder='Week 2 Lecture 3' /><br />
          Description:<br />
          <textarea type='text' data-name='description' onChange={this.setValue} placeholder='Quiz on topic 3' /><br />
          Format: <select data-name='quiz' onChange={this.setValue} >
            <option value='false' default>Lecture Poll</option>
            <option value='true'>Online Quiz</option>
          </select><br />
          { this.state.quiz ? 'Deadline: <datepicker here><br />' : '' }
          <input type='submit' />
        </form>
      </div>
    </div>)
  } //  end render

} // end CreateSessionForm
