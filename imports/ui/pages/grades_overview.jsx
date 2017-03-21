/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// grade_overview.jsx: page for navigating to specific course grades pages

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'

import { CourseListItem } from '../CourseListItem'

class _GradesOverview extends Component {

  constructor (props) {
    super(props)

    this.state = {}
  }

  renderCourseList (cList) {
    return cList.map((c) => (
      <CourseListItem key={c._id} course={c} click={() => { Router.go('course.grades', { _id: c._id }) }} />
    ))
  }

  render () {
    return (
      <div className='container ql-grades-overview'>
        <h2>Grades</h2>
        <div className='ql-courselist'>
          { this.renderCourseList(this.props.courses.filter((c) => !c.inactive)) }
        </div>

        <h2>Inactive Courses</h2>
        <div className='ql-courselist'>
          { this.renderCourseList(this.props.courses.filter((c) => c.inactive)) }
        </div>
      </div>)
  }

}

export const GradesOverview = createContainer((props) => {
  const handle = Meteor.subscribe('courses')

  const user = Meteor.user()
  let courses = []

  if (user.hasGreaterRole('professor')) {
    courses = Courses.find({ owner: user._id })
  } else {
    const coursesArray = user.profile.courses || []
    courses = Courses.find({ _id: { $in: coursesArray } }, { fields: { students: false } })
  }

  return {
    courses: courses.fetch(),
    loading: !handle.ready()
  }
}, _GradesOverview)

