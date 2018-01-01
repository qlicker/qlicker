/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { PropTypes, Component } from 'react'

import _ from 'underscore'

import { createContainer } from 'meteor/react-meteor-data'

//import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'
import { Courses } from '../../../api/courses'
import { Grades } from '../../../api/grades'

import { GradeView } from '../../GradeView'

class _GradeSession extends Component {

  constructor (props) {
    super(props)

    this.state = {
      studentToView : this.props.students[0],
      studentSearchString: ''
    }

    this.setStudentSearchString = this.setStudentSearchString.bind(this)

  }

  setStudentSearchString (e) {
    this.setState({ studentSearchString: e.target.value })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const allStudents = this.props.students
    const studentSearchString = this.state.studentSearchString

    // TODO: First, narrow down by group (optionally, see manage course groups)

    let studentsToShow = studentSearchString
      ? _(allStudents).filter( (entry) => {
        return entry.profile.lastname.toLowerCase().includes(studentSearchString.toLowerCase()) ||
               entry.profile.firstname.toLowerCase().includes(studentSearchString.toLowerCase()) ||
               entry.emails[0].address.toLowerCase().includes(studentSearchString.toLowerCase())
            })
      : allStudents


    const studentToView = studentsToShow[0]
    const gradeToView = studentToView ? _(this.props.grades).findWhere({ userId:studentToView._id }) : null

    return (
      <div className='container ql-grade-session'>
        <div className='row'>
          <div className='col-md-4'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4> Students </h4>
              </div>
              <div className='ql-card-content'>
                <div className='ql-grade-session-student-search'>
                  <div className='ql-grade-session-student-search-controls'>
                    <input type='text' onChange={_.throttle(this.setStudentSearchString, 200)} placeholder='Search by student name or email'></input>
                  </div>
                  <div className='ql-grade-session-studentlist'>
                    { studentToView
                      ? <div className='ql-grade-session-studentlist-title'>
                          Current student: {studentToView.profile.lastname}, {studentToView.profile.firstname}
                        </div>
                      : 'Select a student'
                    }
                    { studentsToShow.map( (student) => {
                        return(
                          <div key={'s2'+student._id} className='ql-grade-session-student'>
                            {student.profile.lastname}, {student.profile.firstname}
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className='col-md-8'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4> Grade </h4>
              </div>
                <div className='ql-card-content'>
                  <div className='ql-grade-session-gradeview'>
                    { gradeToView
                      ?  <GradeView grade={gradeToView} showAttempts />
                      : 'Select a student'
                    }
                  </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

}

export const GradeSession = createContainer((props) => {
  const handle = Meteor.subscribe('grades.forSession', props.sessionId) &&
                 Meteor.subscribe('courses.single', props.courseId) &&
                 Meteor.subscribe('users.studentsInCourse', props.courseId)

  const course = Courses.findOne({ _id: props.courseId })
  const grades = Grades.find({ sessionId:props.sessionId }).fetch()

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  return {
    loading: !handle.ready(),
    grades: grades,
    students: students
  }
}, _GradeSession)

GradeSession.propTypes = {
  sessionId: PropTypes.string,
  courseId: PropTypes.string
}
