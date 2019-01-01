// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx

import React from 'react'
import _ from 'underscore'

import { ControlledForm } from '../ControlledForm'
import moment from 'moment-timezone'

export const DEFAULT_STATE = {
  name: '',
  description: '',
  courseId: '',
  quiz: false,
  date: undefined, // Added the following to have all fields:
  quizStart: undefined,
  quizEnd: undefined,
  status: 'hidden',
  questions: [],
  tags: [],
  reviewable: false
}

/**
 * modal dialog to prompt for course details
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class CreateSessionModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = _.extend({}, DEFAULT_STATE)
  }

  /**
   * done(Event: e)
   * Overrided onChange handler to update state with exception for session details
   */
  setValue (e) {
    let stateEdits = {}
    let key = e.target.dataset.name
    // if (key === 'quiz') stateEdits[e.target.dataset.name] = (e.target.value === 'on')
    if (key === 'quiz'){
      stateEdits[e.target.dataset.name] = !this.state.quiz
      if(!this.state.quiz){// we are setting this to a quiz!!!!
        const now = moment().add(1,'hour')
        const quizStart = now.toDate()
        const quizEnd = now.add(1, 'day').toDate()

        stateEdits.quizStart = quizStart
        stateEdits.quizEnd = quizEnd
      }
    }
    else stateEdits[e.target.dataset.name] = e.target.value
    // stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for course form. Calls courses.createSession
   */
  handleSubmit (e) {
    super.handleSubmit(e)
    let session = _.extend({
      createdAt: new Date(),
      courseId: this.props.courseId,
      reviewable: false
    }, this.state)

    if (Meteor.isTest) {
      this.props.done(session)
    }

    Meteor.call('courses.createSession', this.props.courseId, session, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Session Created')
        this.done()
      }
    })
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.createSessionForm.reset()
    this.setState(_.extend({}, DEFAULT_STATE))
    super.done()
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-card' onClick={this.preventPropagation}>
        <div className='ql-modal-header ql-header-bar'><h3>Create Session</h3></div>
        <form ref='createSessionForm' className='ql-card-content' onSubmit={this.handleSubmit}>
          <label>Quiz (students answer all questions at once):</label>
          <input type='checkbox' checked={this.state.quiz} data-name='quiz' onChange={this.setValue} /> <br />
          <label>Name:</label>
          <input type='text' data-name='name' className='form-control' onChange={this.setValue} placeholder='Week 2 Lecture 3' /><br />
          <label>Description:</label>
          <textarea type='text' data-name='description' className='form-control' onChange={this.setValue} placeholder='Quiz on topic 3' /><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end CreateSessionForm
