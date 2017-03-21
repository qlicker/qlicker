/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// grade_overview.jsx: page for navigating to specific course grades pages
// results_overview.jsx: page for navigating to specific course participation result pages

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'

import { CourseListItem } from '../CourseListItem'

class _ResultsOverview extends Component {

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
        <h2>Student Response Results</h2>
        {
          this.props.courses.map((c) => {
            return <CourseListItem key={c._id} course={c} click={() => { Router.go('course.results', { _id: c._id }) }} />
          })
        }
      </div>)
  }

}

export const ResultsOverview = createContainer((props) => {
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
}, _ResultsOverview)

