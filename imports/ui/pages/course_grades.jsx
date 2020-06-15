// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'

import { CleanGradeTable } from '../CleanGradeTable.jsx'


export class _CourseGrades extends Component {
  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    /*
    <div>
      <GradeTable courseId={this.props.courseId} />
    </div>
    */
    return (
      <div className='container ql-results-page'>
        <div className='ql-card'>
          <div className='ql-header-bar'>
            <div className='row'>
              <div className='col-xs-offset-2 col-xs-8'><h4><span className='uppercase'>{this.props.courseName}</span>: Grades </h4>
              </div>
            </div>
          </div>

          <div className='ql-card-content'>
            <div>
              <CleanGradeTable courseId={this.props.courseId} studentIds={this.props.studentIds} sessionIds={this.props.sessionIds} />
            </div>
          </div>
        </div>
      </div>
    )
  }

}

export const CourseGrades = withTracker((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId)

  const course = Courses.findOne(props.courseId)
  return {
    courseId: props.courseId,
    courseName: course.name,
    studentIds: course.students,
    sessionIds: course.sessions,
    loading: !handle.ready()
  }
})( _CourseGrades)

CourseGrades.propTypes = {
  courseId: PropTypes.string
}
