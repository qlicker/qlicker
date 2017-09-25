// QLICKER
// Author: Enoch T <me@enocht.am>
//
// results.jsx: page for displaying student results for specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'
import { Sessions } from '../../api/sessions'

import { SessionResults } from '../SessionResults'

class _Results extends Component {

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
            <SessionResults session={this.props.session} />
          </div>
        </div>
      </div>
    )
  }

}

// meteor reactive data container
export const ResultsPage = createContainer((props) => {
  const handle = Meteor.subscribe('userData') &&
    Meteor.subscribe('courses') &&
    Meteor.subscribe('sessions')

  const session = Sessions.findOne(props.sessionId)
  const course = Courses.findOne(session.courseId)
  return {
    course: course,
    session: session,
    loading: !handle.ready()
  }
}, _Results)

