// QLICKER
// Author: Enoch T <me@enocht.am>
//
// grades.jsx: page for displaying student results for specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'
import $ from 'jquery'

import { Courses } from '../../api/courses'
import { Questions } from '../../api/questions'
import { Answers } from '../../api/answers'
import { Sessions } from '../../api/sessions'

class _Grades extends Component {

  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const sessionList = this.props.course.sessions || []
    return (
      <div className='container ql-grades-page'>
        <h2>Grades: {this.props.course.name}</h2>
        {
          sessionList.map(s => {
            return JSON.stringify(this.props.sessions[s.sessionId])
          })
        }
      </div>
    )
  }

}

// meteor reactive data container
export const GradesPage = createContainer((props) => {
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
}, _Grades)

