// QLICKER
// Author: Enoch T <me@enocht.am>
//
// professor_dashboard.jsx: professor overview page

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'underscore'

import { StudentCourseComponent } from '../../StudentCourseComponent'
import { CreateCourseModal } from '../../modals/CreateCourseModal'

import { Courses } from '../../../api/courses'
import { Sessions } from '../../../api/sessions'

class _ProfessorDashboard extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingCourse: false, edits: {} }

    this.doneCreatingCourse = this.doneCreatingCourse.bind(this)
    this.promptCreateCourse = this.promptCreateCourse.bind(this)
  }

  promptCreateCourse (e) {
    this.setState({ creatingCourse: true })
  }

  doneCreatingCourse (e) {
    this.setState({ creatingCourse: false })
  }

  render () {
    return (
      <div className='container ql-professor-page'>
        <h1>Welcome to Qlicker</h1>

        <hr />
        <h2>Active Courses</h2>
        <button className='btn btn-default' onClick={this.promptCreateCourse}>Create Course</button>
        <div className='ql-courselist'>
          {this.props.courses.map((course) => (<StudentCourseComponent key={course._id} course={course} sessionRoute='session.edit' />))}
        </div>

        {/* modals */}
        { this.state.creatingCourse ? <CreateCourseModal done={this.doneCreatingCourse} /> : '' }
      </div>)
  }

}

export const ProfessorDashboard = createContainer(() => {
  const handle = Meteor.subscribe('courses') && Meteor.subscribe('sessions')

  const courses = Courses.find({ owner: Meteor.userId(), inactive: { $in: [null, false] } }).fetch()
  const sessions = Sessions.find({
    courseId: { $in: _(courses).pluck('_id') },
    $or: [{ status: 'visible' }, { status: 'running' }]
  }).fetch()
  return {
    courses: courses,
    sessions: sessions,
    loading: !handle.ready()
  }
}, _ProfessorDashboard)

