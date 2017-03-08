/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { PropTypes } from 'react'

import { ListItem } from './ListItem'
import '../api/courses.js'

export class StudentListItem extends ListItem {

  render () {
    const controls = this.makeControls()
    return (
      <div className='ql-student-list-item'>
        <span className='ql-student-name'>{ this.props.student.getName() }</span>
        <span className='ql-student-email'>{ this.props.student.getEmail() } </span>
        {controls}
      </div>)
  } //  end render

}

StudentListItem.propTypes = {
  student: PropTypes.object.isRequired,
  courseId: PropTypes.string.isRequired
}

