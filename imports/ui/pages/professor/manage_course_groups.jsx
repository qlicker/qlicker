/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../../api/courses'

import { ROLES } from '../../../configs'


class _ManageCourseGroups extends Component {

  constructor (props) {
    super(props)

    this.state = {
    }
  }


  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    return(
      <div className='container ql-manage-course-groups'>

      </div>
    )

  }

}

export const ManageCourseGroups = createContainer((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('users.studentsInCourse', props.courseId)

  const course = Courses.find({ _id: props.courseId }).fetch()[0]

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()


  return {
    course: course,
    students: _(students).indexBy('_id'),
    loading: !handle.ready()
  }
}, _ManageCourseGroups)
