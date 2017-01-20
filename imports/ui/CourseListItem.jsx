// QLICKER
// Author: Enoch T <me@enocht.am>
// 
// CourseListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import './CourseListItem.scss'

import '../api/courses.js'

export default class CourseListItem extends Component {

  constructor(props) {
    super(props)
    console.log(this.props.course)
    
    this.navigateToCourse = this.navigateToCourse.bind(this)
  }

  deleteItem(e) {
    e.preventDefault();
    let c = confirm("Are you sure?")
    if (c) {
      Meteor.call('courses.delete', this.props.course._id, (error) => { console.log(error) } )
    }
    
  }

  navigateToCourse() {
    Router.go('manage.course', { _id: this.props.course._id })
  }

  render() {
    let r
    //TODO: extract course string display to helper
    r = (
    <li className='ui-courselist-item' onClick={this.navigateToCourse}>
      <span className='course-name'>{ this.props.course.name }</span>
      <span className='code-number-section'>
        { this.props.course.deptCode + this.props.course.courseNumber + '-' + this.props.course.section }
      </span>
      <span className='controls'><button onClick={this.deleteItem.bind(this)}>Delete</button></span>
    </li>)

    return r
  } //  end render

}

CourseListItem.propTypes = {
  course: PropTypes.object.isRequired,
};

