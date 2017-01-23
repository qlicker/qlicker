/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses.js'

import './manage_course.scss'

class Course extends Component {

  constructor (props) {
    super(props)

    this.state = { }

  }


  renderSessionList () {
    let sessions = this.props.course.sessions || []
    return (<div>
      <ul>
        { sessions.map((s) => {
          return (<li key={s.sessionId} onClick={this.removeSession}>{JSON.stringify(s)}</li>)
        }) }
      </ul>
    </div>)
  }

  render () {
    console.log(this.props.course)
    return (
      <div className='container ui-manage-course'>
        <h2>Course: {this.props.course.name} </h2>
        { JSON.stringify(this.props.course) }
      </div>)
  }

}

export default createContainer((props) => {
  const handle = Meteor.subscribe('courses')

  return {
    course: Courses.find({ _id: props.courseId }).fetch()[0],
    loading: !handle.ready()
  }
}, Course)

