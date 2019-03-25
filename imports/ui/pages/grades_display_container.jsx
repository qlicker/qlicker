// QLICKER
// Author: Jacob Huschilt
//
// page for displaying grades from a given course, either by student, or by session

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'
import { Sessions } from '../../api/sessions'

import { StudentGradeTable } from '../StudentGradeTable'
import { SessionGradeTable } from '../SessionGradeTable'
import 'react-select/dist/react-select.css'

export class _GradeDisplay extends Component {

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    let pageTitle = this.props.courseName
    if (this.props.studentId) {
      pageTitle += ' - ' + this.props.studentName
    } else if (this.props.sessionName) {
      pageTitle += ' - ' + this.props.sessionName
    }

    return (
      <div className='container ql-results-page'>
        <div className='ql-card'>
          <div className='ql-header-bar'>
            <div className='row'>
              <div className='col-xs-offset-2 col-xs-8'>
                <h4>
                  <span className='uppercase'>{pageTitle}</span>: Grades
                </h4>
              </div>
            </div>
          </div>

          <div className='ql-card-content'>
            <div>
              {this.props.sessionId
                ? <SessionGradeTable courseId={this.props.courseId} sessionId={this.props.sessionId} />
                : <StudentGradeTable courseId={this.props.courseId} studentId={this.props.studentId} />
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export const GradeDisplay = createContainer((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('users.studentsInCourse', props.courseId) &&
    Meteor.subscribe('sessions.single', props.sessionId)

  const student = Meteor.users.findOne({_id: props.studentId})
  const studentName = student ? student.profile.firstname + ' ' + student.profile.lastname : ''

  const session = Sessions.findOne({_id: props.sessionId})
  const sessionName = session ? session.name : ''
  const course = Courses.findOne({_id: props.courseId})

  return {
    courseId: props.courseId,
    courseName: course.name,
    studentId: props.studentId,
    studentName: studentName,
    sessionId: props.sessionId,
    sessionName: sessionName,
    loading: !handle.ready()
  }
}, _GradeDisplay)

GradeDisplay.propTypes = {
  courseId: PropTypes.string.isRequired,
  studentId: PropTypes.string,
  sessionId: PropTypes.string
}
