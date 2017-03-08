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

    this.click = this.click.bind(this)
    console.log(this.props)
  }

  deleteItem (e) {
    e.preventDefault()
    e.stopPropagation()

    if (this.props.delete) this.props.delete()
  }

  click () {
    if (this.props.click) this.props.click()
    else Router.go('course', { _id: this.props.course._id })
  }

  render () {
    return (
      <li className='ql-course-list-item' onClick={this.click}>
        <span className='ql-course-name'>{ this.props.course.name }</span>

        <span className='ql-course-code'>{ this.props.course.fullCourseCode() } </span>
        <span className='ql-course-semester'>{ this.props.course.semester }</span>

        { Meteor.user().hasGreaterRole('professor') && this.props.delete
          ? <span className='controls'>
            <button className='btn btn-default' onClick={this.deleteItem.bind(this)}>Delete</button>
          </span>
        : ''}
      </li>)
  } //  end render

}

CourseListItem.propTypes = {
  course: PropTypes.object.isRequired,
  delete: PropTypes.func,
  click: PropTypes.func
}

