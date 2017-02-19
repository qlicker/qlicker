/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CourseListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { Component, PropTypes } from 'react'

import '../api/courses.js'

export class CourseListItem extends Component {

  constructor (props) {
    super(props)

    this.navigateToCourse = this.navigateToCourse.bind(this)
  }

  deleteItem (e) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure?')) {
      Meteor.call('courses.delete', this.props.course._id, (error) => { console.log(error) })
    }
  }

  navigateToCourse () {
    Router.go('course', { _id: this.props.course._id })
  }

  render () {
    let r
    // TODO: extract course string display to helper
    r = (
      <li className='ql-course-list-item' onClick={this.navigateToCourse}>
        <span className='ql-course-name'>{ this.props.course.name }</span>

        <span className='ql-course-code'>{ this.props.course.fullCourseCode() } </span>
        <span className='ql-course-semester'>{ this.props.course.semester }</span>

        { Meteor.user().hasGreaterRole('professor')
          ? <span className='controls'>
            <button className='btn btn-default' onClick={this.deleteItem.bind(this)}>Delete</button>
          </span>
        : ''}
      </li>)

    return r
  } //  end render

}

CourseListItem.propTypes = {
  course: PropTypes.object.isRequired
}

