// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentCourseComponent.jsx: expanding UI component for student dashboard

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Sessions } from '../api/sessions'

import { CourseListItem } from './CourseListItem'
import { SessionListItem } from './SessionListItem'

export class _StudentCourseComponent extends Component {

  constructor (p) {
    super(p)
    this.state = { }
  }


  render () {
    const course = this.props.course
    return (<div className='ql-student-course-component'>
      <CourseListItem course={course} click={() => Router.go('course', { _id: course._id })} />
      <div>
        {
          this.props.sessions.map((s) => {
            return <SessionListItem key={s._id} session={s} click={() => Router.go(this.props.sessionRoute, { _id: s._id })} />
          }) // TODO limit num session on student home page
        }
      </div>
    </div>)
  } //  end render
}

export const StudentCourseComponent = createContainer((props) => {
  const handle = Meteor.subscribe('sessions')
  const sessions = Sessions.find({ courseId: props.course._id, $or: [{ status: 'visible' }, { status: 'running' }] }).fetch()

  return {
    sessions: sessions,
    loading: !handle.ready()
  }
}, _StudentCourseComponent)

StudentCourseComponent.propTypes = {
  course: PropTypes.object.isRequired,
  sessionRoute: PropTypes.string
}

