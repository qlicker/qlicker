// QLICKER
// Author: Enoch T <me@enocht.am>
//
// results.jsx: page for displaying student results for specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'
import $ from 'jquery'

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

    const sessionList = this.props.course.sessions || []
    return (
      <div className='container ql-results-page'>

      <div className='ql-card'>
        <div className='ql-header-bar'>
           <h4>Student Response Results: {this.props.course.name}</h4>
        </div>
        <div className='ql-card-content'>

        {
          sessionList.map(sessionId => {
            const s = this.props.sessions[sessionId]
            return <div className='session-group'>
              <h3>{s.name}</h3>
              <SessionResults key={sessionId} session={s} />
            </div>
          })
        }

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

  const user = Meteor.user()

  const course = Courses.findOne(props.courseId)

  const sessionQuery = { courseId: course._id }
  if (user.hasRole('student')) sessionQuery.status = { $ne: 'hidden' }
  const sessions = Sessions.find(sessionQuery).fetch()

  return {
    course: course,
    sessions: _(sessions).indexBy('_id'),
    loading: !handle.ready()
  }
}, _Results)

