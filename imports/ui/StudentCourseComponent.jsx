// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentCourseComponent.jsx: expanding UI component for student dashboard

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Sessions } from '../api/sessions'

import { CourseListItem } from './CourseListItem'
import { SessionListItem } from './SessionListItem'

/**
 * React component (meteor reactive) that combines a CourseListItem and SessionListItem for active sessions.
 * @prop {Course} course - course object
 * @prop {String} sessionRoute - route to navigate to for each session
 */
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
            if (!s) return
            const sId = s._id
            const nav = () => {
              if (!Meteor.user().isInstructor(this.props.course._id)) Router.go(this.props.sessionRoute, { _id: s._id })
              else if (s.status === 'running') Router.go('session.run', { _id: sId })
              else Router.go('session.edit', { _id: sId })
            }
            return <SessionListItem key={s._id} session={s} click={nav} />
          })
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

