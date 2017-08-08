/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionListItem.jsx

import React, { PropTypes } from 'react'

import { ListItem } from './ListItem'
import '../api/courses.js'

/**
 * React component list item for each student in a course.
 * typically used in professor course screen
 * @augments ListItem
 * @prop {User} student - user object
 * @prop {MongoId} courseId - id of course this component is being used in
 * @prop {String} role - whether this user is a student or TA
 */
export class StudentListItem extends ListItem {

  render () {
    const controls = this.makeControls()
    let role = ''
    if (this.props.role) {
      role += ' (' + this.props.role + ')'
    }
    return (
      <div className='ql-student-list-item ql-list-item'>
        <div
          className='img-circle ql-profile-image'
          style={{
            backgroundImage: 'url(' + this.props.student.getImageUrl() + ')'
          }} />
        <div className='student-details'>
          <span className='student-name'>{ this.props.student.getName() + role }</span>
          <span className='student-email'>{ this.props.student.getEmail() } </span>
        </div>
        <div className='controls'>{controls}</div>
      </div>)
  } //  end render

}

StudentListItem.propTypes = {
  student: PropTypes.object.isRequired,
  courseId: PropTypes.string.isRequired,
  role: PropTypes.string
}

