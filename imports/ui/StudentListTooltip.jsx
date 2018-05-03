// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// StudentListTooltip.jsx: component for viewing a list of students in a tooltip

import React, { Component, PropTypes } from 'react'


export class StudentListTooltip extends Component {

  constructor (p) {
    super(p)

  }

  render(){
    students = this.props.students
    return (
      <div className='student-list'>
        {students.map(student =>
          (<div key={student._id} onClick={(e) => this.props.toggleProfileViewModal(student)} className='student-item'>
            <div>
              {student.profile.lastname + ', ' + student.profile.firstname}
            </div>
          </div>)
        )}
      </div>
    )
  }
}

StudentListTooltip.propTypes = {
  students: PropTypes.array.isRequired,
  toggleProfileViewModal: PropTypes.func.isRequired
}

