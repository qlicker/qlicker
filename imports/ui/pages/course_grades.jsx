// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'

import { GradeTable } from '../GradeTable.jsx'

export class _CourseGrades extends Component {
  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    return (
      <div className='container ql-results-page'>
        <div className='ql-card'>
          <div className='ql-header-bar'>
            <div className='row'>
              <div className='col-xs-offset-2 col-xs-8'><h4><span className='uppercase'>{this.props.courseName}</span>: Results (participation/grade)</h4>
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


export const CourseGrades = createContainer((props) => {
  //const handle = Meteor.subscribe('users.myStudents', {cId: props.courseId}) &&
    //Meteor.subscribe('courses', {isInstructor: Meteor.user().isInstructor(props.courseId)})
  const handle = Meteor.subscribe('users.myStudents', {cId: props.courseId}) &&
     Meteor.subscribe('courses', {isInstructor: Meteor.user().isInstructor(props.courseId)}) &&
    Meteor.subscribe('sessions') &&
     Meteor.subscribe('questions.inCourse', props.courseId) &&
     Meteor.subscribe('responses.forCourse', props.courseId) &&
     Meteor.subscribe('grades.forCourse', props.courseId)


    const course = Courses.findOne(props.courseId)
    const courseName = course.fullCourseCode()
    return {
      courseId: props.courseId,
      courseName: course.name,
      loading: !handle.ready(),
    }
}, _CourseGrades)

CourseGrades.propTypes = {
  courseId: PropTypes.string
}
