// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component, PropTypes } from 'react'
import { GradeTable } from '../GradeTable.jsx'

export class CourseGrades extends Component {
  render () {
    return (
      <div className='container ql-results-page'>
        <div className='ql-card'>
          <div className='ql-header-bar'>
            <div className='row'>
              <div className='col-xs-offset-2 col-xs-8'><h4><span className='uppercase'>{this.props.course.fullCourseCode()}</span>: Results (participation/grade)</h4>
              </div>
            </div>
          </div>

          <div className='ql-card-content'>
            <div>
              <GradeTable courseId={this.props.courseId}  />
            </div>
          </div>
        </div>
      </div>
    )
  }

}

CourseGrades.propTypes = {
  courseId: PropTypes.string
}
