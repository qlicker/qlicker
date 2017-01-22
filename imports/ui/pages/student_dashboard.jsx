// QLICKER
// Author: Enoch T <me@enocht.am>
//
// student_dashboard.jsx: student overview page


import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses.js'

class StudentDashboard extends Component {
  constructor (props) {
    super(props)

    this.state = { enrollingInCourse: false }
  }

  render () {
    return (
      <div className='container ui-student-page'>
        <h2>My Classes</h2>
        <button onClick={this.promptForCode}>Enroll in Course</button>

        <hr />
        { JSON.stringify(this.props.courses) }

      </div>)
  }
}

export default createContainer(() => {
  const handle = Meteor.subscribe('courses')
  const cArr = Meteor.user().profile.courses || []
  return {
    courses: Courses.find({ _id: { $in: cArr } }).fetch(),
    loading: !handle.ready()
  }
}, StudentDashboard)
