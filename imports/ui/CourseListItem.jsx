// QLICKER
// Author: Enoch T <me@enocht.am>
// 
// CourseListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import '../api/courses.js'

export default class CourseListItem extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    let r
    //TODO: extract course string display to helper
    r = (
    <li className='ui-courselist-item'>
      <span className='course-name'>{ this.props.course.name }</span>
      <span className='code-number-section'>
        { this.props.course.deptCode + this.props.course.courseNumber + '-' + this.props.course.section }
      </span>
    </li>)

    return r
  } //  end render

}

CourseListItem.propTypes = {
  course: PropTypes.object.isRequired,
};

