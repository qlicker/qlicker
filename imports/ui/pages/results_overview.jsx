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
      <CourseListItem key={c._id} course={c} click={() => { Router.go('course.results', { _id: c._id }) }} />
    ))
  }

  render () {
    return (
      <div className='container ql-grades-overview'>
        <h2>Response Results</h2>
        <div className='ql-courselist'>
          { this.renderCourseList(this.props.courses.filter((c) => !c.inactive)) }
        </div>
        <br />
        <h2 className='m-margin-top'>Inactive Courses</h2>
        <div className='ql-courselist'>
          { this.renderCourseList(this.props.courses.filter((c) => c.inactive)) }
        </div>
      </div>)
  }

}

export const ResultsOverview = createContainer((props) => {
  const handle = Meteor.subscribe('courses')

  const user = Meteor.user()
  let courses = []
  const coursesArray = user.profile.courses || []
  courses = Courses.find({instructors: user._id}) || Courses.find({ _id: { $in: coursesArray } }, { fields: { students: false } })

  return {
    courses: courses.fetch(),
    loading: !handle.ready()
  }
}, _ResultsOverview)

