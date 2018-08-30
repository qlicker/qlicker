// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// questions_library.jsx: page for navigating between questions libraries

import React, { Component } from 'react'

import { QuestionsLibrary } from './questions_library';

export class QuestionsNav extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedLibrary: 'library',
      courseCode: '',
    }
  }

  componentDidMount () {
    Meteor.call('courses.getCourseCode', this.props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course code')
      else this.setState({ courseCode: c })
    })
  }

  componentWillReceiveProps (props) {
    Meteor.call('courses.getCourseCode', props.courseId, (e, c) => {
      if (e) alertify.error('Cannot get course code')
      else this.setState({ courseCode: c })
    })
  }

  render () {
    const isInstructor = Meteor.user().isInstructor(this.props.courseId)
    const active = this.state.selectedLibrary
    const setLib = (lib) => this.setState({selectedLibrary: lib})
    return(
      <div className='container ql-questions-library'>
        <h1>Questions for {this.state.courseCode || 'Course'}</h1>
        <ul className='nav nav-pills'>
          <li role='presentation' className={active === 'library' ? 'active' : ''}>
            <a role='button' onClick={() => setLib('library')}>{isInstructor ? 'Course Library' : 'My Library'}</a>
          </li>
          <li role='presentation' className={active === 'public' ? 'active' : ''}>
            <a role='button' onClick={() => setLib('public')}>Public Questions</a>
          </li>
          { isInstructor
            ? <li role='presentation' className={active === 'unapprovedFromStudents' ? 'active' : ''}>
                <a role='button' onClick={() => setLib('unapprovedFromStudents')}>Student Submissions</a>
              </li>
            : '' }
        </ul>

        <QuestionsLibrary
          courseId={this.props.courseId}
          questionLibrary={this.state.selectedLibrary}/>
      </div>
    )
  }
}
