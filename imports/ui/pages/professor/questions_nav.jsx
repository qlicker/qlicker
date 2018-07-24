// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// questions_library.jsx: page for navigating between questions libraries

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { QuestionsLibrary } from './questions_library';

class _QuestionsNav extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selected: 'library',
      courseCode: ''
    }

    Meteor.call('courses.getCourseCode', props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course code')
      else this.state.courseCode = c
    })

    Meteor.call('courses.courseRequiresApprovedQuestions', props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course permissions')
      else this.state.requireApprovedQuestions = c
    })
  }

  componentWillReceiveProps (props) {
    Meteor.call('courses.getCourseCode', props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course code')
      else this.setState({ courseCode: c })
    })

    Meteor.call('courses.courseRequiresApprovedQuestions', props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course permissions')
      else this.setState({ requireApprovedQuestions: c })
    })
  }

  render () {
    const isInstructor = Meteor.user().isInstructorAnyCourse()
    const active = this.state.selected

    return(
      <div className='container ql-questions-library'>
        <h1>Questions for {this.state.courseCode || 'Course'}</h1>
        <ul className='nav nav-pills'>
          <li role='presentation' className={active === 'library' ? 'active' : ''}>
            <a role='button' onClick={() => this.setState({ selected: 'library' })}>{isInstructor ? 'Course Library' : 'My Library'}</a>
          </li>
          <li role='presentation' className={active === 'public' ? 'active' : ''}><a role='button' onClick={() => this.setState({ selected: 'public' })}>Public Questions</a></li>
          { isInstructor && this.state.requireApprovedQuestions
            ? <li role='presentation' className={active === 'student' ? 'active' : ''}><a role='button' onClick={() => this.setState({ selected: 'student' })}>Student Submissions</a></li>
            : '' }          
          <li role='presentation' className={active === 'shared' ? 'active' : ''}><a role='button' onClick={() => this.setState({ selected: 'shared' })}>Questions Shared With Me</a></li> 
        </ul>

        <QuestionsLibrary
          courseId={this.props.courseId}
          library={this.state.selected}/>
      </div>
    )
  }
}

export const QuestionsNav = createContainer(props => {

  return {
    courseId: props.courseId
  }
}, _QuestionsNav)