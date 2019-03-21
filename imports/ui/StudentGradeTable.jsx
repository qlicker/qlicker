
// QLICKER
// Author: Jacob Huschilt, Ryan Martin
//
// StudentGradeTable.jsx: Component for displaying grades from a given course and student

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
//
import { _ } from 'underscore'

import {Table, Column, Cell} from 'fixed-data-table-2'
import 'fixed-data-table-2/dist/fixed-data-table.css'

import { Courses } from '../api/courses'
import { Sessions } from '../api/sessions'
import { Grades } from '../api/grades'

import { GradeViewModal } from './modals/GradeViewModal'
import { ProfileViewModal } from './modals/ProfileViewModal'

/**
 * React Component (meteor reactive) to display Question object and send question responses.
 * @prop {Id} courseId - Id of course to show
 */
export class _StudentGradeTable extends Component {

  constructor (props) {
    super(props)

    this.state = { gradeViewModal: false,
      profileViewModal: false,
      average: 0,
      participation: 0
    }

    this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
    this.calculateAllGrades = this.calculateAllGrades.bind(this)
    this.calculateSessionGrades = this.calculateSessionGrades.bind(this)
  }

  componentWillReceiveProps (nextProps, nextContext) {
    Meteor.call('grades.forCourse.average', nextProps.courseId, nextProps.studentId, (error, average) => {
      if (error) {
        alertify.error('Error calculating average')
      } else {
        this.setState({average: average})
      }
    })

    Meteor.call('grades.participation.average', nextProps.courseId, nextProps.studentId, (error, participation) => {
      if (error) {
        alertify.error('Error calculating participation')
      } else {
        this.setState({participation: participation})
      }
    })
  }

  done (e) {
    this.refs.searchStudentForm.reset()
    this.props.done()
  }

  toggleGradeViewModal (gradeToView = null) {
    this.setState({
      gradeViewModal: !this.state.gradeViewModal,
      gradeToView: gradeToView
    })
  }

  toggleProfileViewModal (studentToView = null) {
    this.setState({
      profileViewModal: !this.state.profileViewModal,
      studentToView: studentToView
    })
  }

  calculateSessionGrades (sessionId) {
    if (confirm('Are you sure?')) {
      Meteor.call('grades.calcSessionGrades', sessionId, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Grades calculated')
        }
      })
    }
  }

  calculateAllGrades () {
    if (confirm('Are you sure?')) {
      const tableData = this.props.tableData
      for (let i = 0; i < tableData.length; i++) {
        Meteor.call('grades.calcSessionGrades', tableData[i].session._id, (err) => {
          if (err) {
            alertify.error('Error: ' + err.error)
          } else {
            alertify.success('Grades calculated for ' + tableData[i].session[i].name)
          }
        })
      }
    }
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const user = Meteor.user()
    const isInstructor = user.isInstructor(this.props.courseId)
    const columnNames = ['Session', 'Participation / Grade']
    const rowHeight = 35
    const headerHeight = 50

    if ((!this.props.grades || this.props.grades.length < 1) && isInstructor) {
      return (<div>
        <div type='button' className='btn btn-secondary' onClick={this.calculateAllGrades}>
          Calculate grades!
        </div>
      </div>)
    }

    const getTextWidth = (text) => {
      let element = document.createElement('canvas')
      let context = element.getContext('2d')
      const width = (context.measureText(text).width + 50)
      if (width < 110) return 110
      else if (width > 300) return 300
      else return width
    }

    const getColumnWidth = (columnIndex) => {
      let maxWidth = 0
      switch (columnIndex) {
        case 0: // Sessions
          this.props.tableData.forEach((row) => {
            const sessionNameWidth = getTextWidth(row.session.name + 40)
            maxWidth = sessionNameWidth > maxWidth ? sessionNameWidth : maxWidth
          })
          maxWidth = Math.max(getTextWidth(columnNames[0]), maxWidth)
          break
        case 1: // Grades
          maxWidth = Math.max(getTextWidth(columnNames[1]), 'No Grade'.length, '✓100 / 100'.length)
          break
        default:
          alertify.error('Error: Unrecognized Column Index')
      }

      return maxWidth
    }

    const getTableWidth = (columns) => {
      let totalWidth = 0
      for (let i = 0; i < columns.length; i++) {
        totalWidth += getColumnWidth(i)
      }

      return totalWidth
    }

    const SessionHeaderCell = () => {
      return (
        <Cell>
          {columnNames[0]}
        </Cell>
      )
    }

    const GradeHeaderCell = () => {
      return (
        <Cell>
          {columnNames[1]}
        </Cell>
      )
    }

    const SessionCell = ({rowIndex}) => {
      if (rowIndex === 0) { // Special Case: Overall Average
        return (
          <Cell>Average</Cell>
        )
      } else if (rowIndex === 1) { // Special Case: Overall Participation
        return (
          <Cell>Participation</Cell>
        )
      }
      const adjustedIndex = rowIndex - 2 >= 0 ? rowIndex - 2 : 0
      const row = this.props.tableData[adjustedIndex]
      const session = row.session
      const calcSessionGrades = () => this.calculateSessionGrades(session._id)
      const viewSession = () => Router.go('session.results', {sessionId: session._id, courseId: this.props.courseId})
      const headerClass = session.gradesViewable()
        ? 'ql-grade-table-session-header'
        : 'ql-grade-table-session-header hidden-from-students'

      return (
        <Cell>
          <div className={headerClass} onClick={viewSession} >{session.name} </div>
          {isInstructor ? <div onClick={calcSessionGrades} className='glyphicon glyphicon-repeat ql-grade-table-grade-calc-button' /> : ''}
        </Cell>
      )
    }

    const GradeCell = ({rowIndex}) => {
      if (rowIndex === 0) { // Special Case: Overall Average
        return (
          <Cell>{this.state.average.toFixed(0)}%</Cell>
        )
      } else if (rowIndex === 1) { // Special Case: Overall Participation
        return (
          <Cell>{this.state.participation.toFixed(0)}%</Cell>
        )
      }
      const adjustedIndex = rowIndex - 2 >= 0 ? rowIndex - 2 : 0
      const grade = this.props.tableData[adjustedIndex].grade
      let cellClass = 'ql-grade-cell'
      if (grade) {
        if (grade.hasUngradedMarks()) cellClass = 'ql-grade-cell-needs-grading'
      }

      const onClick = () => this.toggleGradeViewModal(grade)
      return (grade
          ? <Cell onClick={onClick}>
            <div className={cellClass}>
              {grade.joined ? '✓' : '✗'} { grade.participation.toFixed(0) }% / { grade.value.toFixed(0)}%
            </div>
          </Cell>
          : <Cell> No grade </Cell>
      )
    }

    const showGradeViewModal = this.state.gradeViewModal && this.props.student && !this.state.profileViewModal
    const showProfileViewModal = this.state.profileViewModal && this.props.student && !this.state.gradeViewModal

    return (
      <div className='ql-grade-table-container' ref='gradeTableContainer'>
        <div className='ql-grade-table-controlbar'>
          {isInstructor
            ? <div className='ql-grade-table-controlbar-div'>
              <div>
                <div type='button' className='btn btn-secondary' onClick={this.calculateAllGrades}>
                  Re-calculate all course grades
                </div>
              </div>
            </div>
            : ''
          }
        </div>
        <Table
          rowHeight={rowHeight}
          rowsCount={this.props.tableData.length + 2}
          width={Math.min(getTableWidth(columnNames), 0.8 * window.innerWidth)}
          height={Math.min(rowHeight * (this.props.tableData.length + 2) + headerHeight + 2, 0.7 * window.innerHeight)}
          headerHeight={headerHeight}>
          <Column
            header={<SessionHeaderCell />}
            cell={<SessionCell />}
            fixed
            width={getTextWidth(columnNames[0])}
          />
          <Column
            header={<GradeHeaderCell />}
            cell={<GradeCell />}
            fixed
            width={getTextWidth(columnNames[1])}
          />

        </Table>
        { showGradeViewModal
          ? <GradeViewModal
            grade={this.state.gradeToView}
            student={this.props.student}
            done={this.toggleGradeViewModal} />
          : '' }
        { showProfileViewModal
          ? <ProfileViewModal
            user={this.props.student}
            done={this.toggleProfileViewModal} />
          : '' }
      </div>
    )
  } // end render
}

// meteor reactive data container
export const StudentGradeTable = createContainer((props) => {
  const handle = Meteor.subscribe('users.studentsInCourse', props.courseId) &&
    Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('sessions.forCourse', props.courseId) &&
    Meteor.subscribe('grades.forCourse', props.courseId, {'marks': 0})

  const user = Meteor.user()
  const course = Courses.findOne(props.courseId)

  const student = Meteor.users.findOne({_id: props.studentId})

  const grades = Grades.find({courseId: props.courseId, userId: props.studentId}).fetch()

  let sessions

  if (course) {
    const sessionQuery = {courseId: course._id}
    if (!user.isAdmin() && !user.isInstructor(props.courseId)) {
      sessionQuery.status = {$ne: 'hidden'}
      sessionQuery.reviewable = true
    }
    sessions = Sessions.find(sessionQuery, {sort: {date: 1}}).fetch()
  }
  const tableData = []

  sessions.forEach((session) => {
    const result = _(grades).where({sessionId: session._id})
    const grade = result.length > 0 ? result[0] : null

    let participation = 0
    if (grades.length > 0) {
      participation = _(grades).reduce((total, grade) => {
        let gpart = 0
        if (grade && grade.participation) {
          gpart = grade.participation
        }
        return total + gpart
      }, 0) / grades.length
    }

    let dataItem = {
      session: session,
      grade: grade,
      participation: participation
    }
    tableData.push(dataItem)
  })

  return {
    courseId: props.courseId,
    courseName: course.name,
    student: student,
    grades: grades,
    tableData: tableData,
    loading: !handle.ready()
  }
}, _StudentGradeTable)

StudentGradeTable.propTypes = {
  courseId: PropTypes.string,
  studentId: PropTypes.string
}
