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
    
    r = (
    <div className='ui-courselist-item'>
      { this.props.course.name }
    </div>)

    return r
  } //  end render

}

CourseListItem.propTypes = {
  course: PropTypes.object.isRequired,
};

