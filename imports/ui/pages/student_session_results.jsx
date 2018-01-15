// QLICKER
// Author: Enoch T <me@enocht.am>
//
// student_session_results.jsx: page for students to review previous sessions

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'
import { Sessions } from '../../api/sessions'

import { StudentSessionResults } from '../StudentSessionResults'

class _StudentSessionResultsPage extends Component {

  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    return (
      <div className='container ql-results-page'>

        <div className='ql-card'>
          <div className='ql-header-bar'>
            <h4>{this.props.session.name} (<span className='uppercase'>{this.props.course.fullCourseCode()}</span>)</h4>
          </div>
          <div className='ql-card-content'>
            <StudentSessionResults session={this.props.session} studentId={this.props.studentId} />
          </div>
        </div>
      </div>
    )
  }

}

// meteor reactive data container
export const StudentSessionResultsPage = createContainer((props) => {
  const handle = Meteor.subscribe('userData') &&
    Meteor.subscribe('courses') &&
    Meteor.subscribe('sessions.single', props.sessionId)

  const session = Sessions.findOne(props.sessionId)
  const course = Courses.findOne(session.courseId)

  return {
    course: course,
    session: session,
    loading: !handle.ready()
  }
}, _StudentSessionResultsPage)
