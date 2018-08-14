// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// questions_library.jsx: page for navigating between questions libraries

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { QuestionsLibrary } from './questions_library';

export const questionLibraries = {
  library: 'library',
  public: 'public',
  unapprovedFromStudents: 'unapprovedFromStudents',
  sharedWithUser: 'sharedWithUser'
}

class _QuestionsNav extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selected: questionLibraries.library,
      courseCode: '',
    }
  }

  componentDidMount () {
    Meteor.call('courses.getCourseCode', this.props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course code')
      else this.setState({ courseCode: c })
    })

    Meteor.call('courses.publicQuestionsRequireApproval', this.props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course permissions')
      else this.setState({ requireApprovedPublicQuestions: c })
    })
  }

  componentWillReceiveProps (props) {
    Meteor.call('courses.getCourseCode', props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course code')
      else this.setState({ courseCode: c })
    })

    Meteor.call('courses.publicQuestionsRequireApproval', props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course permissions')
      else this.setState({ requireApprovedPublicQuestions: c })
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
          { isInstructor && this.state.requireApprovedPublicQuestions
            ? <li role='presentation' className={active === 'unapprovedFromStudents' ? 'active' : ''}><a role='button' onClick={() => this.setState({ selected: 'unapprovedFromStudents' })}>Student Submissions</a></li>
            : '' }          
          <li role='presentation' className={active === 'sharedWithUser' ? 'active' : ''}><a role='button' onClick={() => this.setState({ selected: 'sharedWithUser' })}>Questions Shared With Me</a></li> 
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