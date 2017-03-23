/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CourseListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { PropTypes } from 'react'

import { ListItem } from './ListItem'
import '../api/courses.js'

export class CourseListItem extends ListItem {

  render () {
    const controls = this.makeControls()
    return (
      <div className={'ql-course-list-item ' + (this.props.click ? 'click' : '')} onClick={this.click}>
        <span className='ql-course-code'>{ this.props.course.fullCourseCode() } </span>

        <span className='ql-course-name'>{ this.props.course.name }</span>

        <span className='ql-course-semester'>{ this.props.course.semester }</span>

        { this.props.controls ? <span className='controls'>{controls}</span> : '' }
      </div>)
  } //  end render

}

CourseListItem.propTypes = {
  course: PropTypes.object.isRequired,
  click: PropTypes.func
}

