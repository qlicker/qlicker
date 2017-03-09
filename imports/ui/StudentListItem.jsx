/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { PropTypes } from 'react'

import '../api/courses.js'

export class StudentListItem extends Component {

  // constructor (props) {
  //   super(props)
  // }

  deleteItem (e) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure?')) {
      Meteor.call('courses.removeStudent',
        this.props.courseId,
        this.props.student._id,
        (error) => { console.log(error) })
    }
  }

  render () {
    const navigateToStudent = () => { Router.go('session', { _id: this.props.session._id }) }
    return (
      <li className='ql-student-list-item' onClick={navigateToStudent}>
        <span className='ql-student-name'>{ this.props.student.getName() }</span>
        <span className='ql-student-email'>{ this.props.student.getEmail() } </span>
        { Meteor.user().hasGreaterRole('professor')
          ? <span className='controls'>
            <button className='btn btn-default' onClick={this.deleteItem.bind(this)}>Delete</button>
          </span>
          : ''}
      </li>)
  } //  end render

}

StudentListItem.propTypes = {
  student: PropTypes.object.isRequired,
  courseId: PropTypes.string.isRequired
}

