/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'
import { Sessions } from '../../api/sessions'
import { SessionListItem } from '../SessionListItem'

if (Meteor.isClient) import './course.scss'

class Course extends Component {

  constructor (props) {
    super(props)

    this.state = { }
  }

  renderSessionList () {
    // let sessions = this.props.course.sessions || []
    let sessions = this.props.sessions || []
    return (<div>
      <ul>
        { sessions.map((s) => {
          return (<SessionListItem key={s.sessionId} session={s} />)
        }) }
      </ul>
    </div>)
  }

  render () {
    console.log(this.props.sessions)
    return (
      <div className='container ui-manage-course'>
        <h2>Course: {this.props.course.name} </h2>
        { JSON.stringify(this.props.course) }
        { this.renderSessionList() }
      </div>)
  }

}

export default createContainer((props) => {
  const handle = Meteor.subscribe('courses') && Meteor.subscribe('sessions')

  let student = Meteor.users.find({ _id: Meteor.userId() }).fetch()[0]
  return {
    course: Courses.find({ _id: props.courseId }).fetch()[0],
    student: student,
    sessions: Sessions.find({ courseId: { $in: student.profile.courses || [] } }).fetch(),
    loading: !handle.ready()
  }
}, Course)

