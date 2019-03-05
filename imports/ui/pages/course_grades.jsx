// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'

import { GradeTable } from '../GradeTable.jsx'
import { MaterialUITable } from '../material_ui_table.jsx'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import { Sessions } from '../../api/sessions'
import { Grades } from '../../api/grades'

export class _CourseGrades extends Component {

  constructor (props) {
    super(props)

    this.state = {
      studentTag: null,
      studentTagSuggestions: [],
      nStudentQuery: 0,
      sessionTag: null,
      sessionTagSuggestions: [],
      nSessionQuery: 0,
      unmarkedSessionTag: null,
      unmarkedSessionTagSuggestions: [],
      nUnmarkedSessionQuery: 0
    }

    this.setStudentState = this.setStudentState.bind(this)
    this.setSessionState = this.setSessionState.bind(this)
    this.setUnmarkedSessionState = this.setUnmarkedSessionState.bind(this)
    this.startMarkingClicked = this.startMarkingClicked.bind(this)
  }

  componentDidMount () {
    this.generateStudentOptions(this.props.students)
    this.generateSessionOptions(this.props.sessions)
    this.generateUnmarkedSessionOptions(this.props.sessions, this.props.unmarkedGrades)
  }

  componentWillReceiveProps (nextProps) {
    this.generateStudentOptions(nextProps.students)
    this.generateSessionOptions(nextProps.sessions)
    this.generateUnmarkedSessionOptions(nextProps.sessions, nextProps.unmarkedGrades)
  }

  generateStudentOptions (students) {
    let studentTagSuggestions = []
    students.forEach((student) => {
      const studentName = student.profile.lastname + ', ' + student.profile.firstname
      studentTagSuggestions.push({value: student._id, label: studentName})
    })
    this.setState({studentTagSuggestions: studentTagSuggestions})
  }

  generateSessionOptions (sessions) {
    let sessionTagSuggestions = []
    sessions.forEach((session) => {
      sessionTagSuggestions.push({value: session._id, label: session.name})
    })
    this.setState({sessionTagSuggestions: sessionTagSuggestions})
  }

  generateUnmarkedSessionOptions (sessions, unmarkedGrades) {
    let unmarkedSessionTagSuggestions = []

    unmarkedGrades.forEach((unmarkedGrade) => {
      sessions.forEach((session) => {
        if (session._id === unmarkedGrade.sessionId) {
          unmarkedSessionTagSuggestions.push({value: session, label: session.name})
        }
      })
    })

    unmarkedSessionTagSuggestions.sort(_CourseGrades.unmarkedSessionTagCompare)

    const selectedTag = unmarkedSessionTagSuggestions.length > 0 ? unmarkedSessionTagSuggestions[0] : null
    this.setState({unmarkedSessionTagSuggestions: unmarkedSessionTagSuggestions, unmarkedSessionTag: selectedTag})
  }

  static unmarkedSessionTagCompare (session1, session2) {
    return session1.value.quizEnd - session2.value.quizEnd
  }

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
            {/* TODO: Need to ensure that the student select only appears for the admins/instructors/TA's of the course */}
            <Select
              name='student-input'
              placeholder='Type to search students'
              value={this.state.studentTag}
              options={this.state.studentTagSuggestions}
              onChange={this.setStudentState}
            />
            <Select
              name='session-input'
              placeholder='Type to search sessions'
              value={this.state.sessionTag}
              options={this.state.sessionTagSuggestions}
              onChange={this.setSessionState}
            />
            <div>
              <Select
                name='unmarked-input'
                placeholder='Type to search unmarked sessions'
                value={this.state.unmarkedSessionTag}
                options={this.state.unmarkedSessionTagSuggestions}
                onChange={this.setUnmarkedSessionState}
              />
              <button className='btn btn-primary' onClick={this.startMarkingClicked}>Start Marking</button>
            </div>
            <div>
              <GradeTable courseId={this.props.courseId} />
              <MaterialUITable courseId={this.props.courseId} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  setStudentState (student) {
    // TODO: Navigate to the student grade dashboard
    this.setState({studentTag: student}, () => {
      Router.go('results.overview', {courseId: this.props.courseId})
    })
  }

  setSessionState (session) {
    // TODO: Navigate to the session grade dashboard
    this.setState({sessionTag: session}, () => {
      alertify.success(session.label)
    })
  }

  setUnmarkedSessionState (unmarkedSession) {
    this.setState({unmarkedSessionTag: unmarkedSession})
  }

  startMarkingClicked () {
    Router.go('session.grade', {courseId: this.props.courseId, sessionId: this.state.unmarkedSessionTag.value._id})
  }
}

export const CourseGrades = createContainer((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('sessions.forCourse', props.courseId) &&
    Meteor.subscribe('users.studentsInCourse', props.courseId) &&
    Meteor.subscribe('grades.forCourse.unmarked', props.courseId)

  const course = Courses.findOne({_id: props.courseId})

  const studentIds = course.students || []
  const students = Meteor.users.find({_id: {$in: studentIds}}).fetch()

  // TODO: Check to see if they're a student somewhere maybe in the router to see if they can view this page
  const sessions = Sessions.find({courseId: props.courseId}, {sort: {date: -1}}).fetch()

  const unmarkedGrades = Grades.find({courseId: props.courseId, needsGrading: true}).fetch()

  return {
    courseId: props.courseId,
    students: students,
    sessions: sessions,
    unmarkedGrades: unmarkedGrades,
    courseName: course.name,
    loading: !handle.ready()
  }
}, _CourseGrades)

CourseGrades.propTypes = {
  courseId: PropTypes.string
}
