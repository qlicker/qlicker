
// QLICKER
// Author: Jacob Huschilt
//
// SessionGradeTable.jsx: Component for displaying grades for a given session

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
 * React Component (meteor reactive) to display the grades of a session
 * @prop {Id} courseId - Id of course grades to show
 * @prop {Id} sessionId - Id of session grades to show
 */
export class _SessionGradeTable extends Component {

  constructor (props) {
    super(props)

    this.state = { gradeViewModal: false,
      profileViewModal: false,
      gradeToView: null,
      studentToView: null,
      averages: {},
      participations: {}
    }

    this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
    this.calculateSessionGrades = this.calculateSessionGrades.bind(this)
    this.fetchAverages = this.fetchAverages.bind(this)
  }

  componentWillReceiveProps (nextProps, nextContext) {
    this.fetchAverages(nextProps.courseId, nextProps.sessionId, nextProps.students)
  }

  fetchAverages (courseId, sessionId, students) {
    students.forEach((student) => {
      Meteor.call('grades.forSession.average', sessionId, courseId, student._id, (error, average) => {
        if (error) {
          alertify.error('Could not retrieve student average for: ' + this.props.session.name)
        } else {
          this.setState((state, props) => {
            let updatedStudentAverages = state.averages
            updatedStudentAverages[student._id] = average
            return {
              averages: state.averages
            }
          })
        }
      })
      Meteor.call('grades.participation.forSession.average', sessionId, courseId, student._id, (error, participation) => {
        if (error) {
          alertify.error('Could not retrieve student participation average for: ' + this.props.session.name)
        } else {
          this.setState((state, props) => {
            let updatedStudentParticipation = state.participations
            updatedStudentParticipation[student._id] = participation

            return {
              participations: updatedStudentParticipation
            }
          })
        }
      })
    })
  }

  done (e) {
    this.refs.searchStudentForm.reset()
    this.props.done()
  }

  toggleGradeViewModal (gradeToView = null) {
    const studentToView = _(this.props.students).findWhere({_id: gradeToView.userId})
    this.setState({
      gradeViewModal: !this.state.gradeViewModal,
      gradeToView: gradeToView,
      studentToView: studentToView
    })
  }

  toggleProfileViewModal (studentToView = null) {
    this.setState({
      profileViewModal: !this.state.profileViewModal,
      studentToView: studentToView
    })
  }

  calculateSessionGrades () {
    if (confirm('Are you sure you want to re-calculate all student grades for ' + this.props.session.name + '?')) {
      Meteor.call('grades.calcSessionGrades', this.props.sessionId, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Grades calculated')
        }
      })
    }
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const user = Meteor.user()
    const isInstructor = user.isInstructor(this.props.courseId)
    const columnNames = ['Student', 'Participation / Grade', 'Overall Average', 'Overall Participation']
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
            const sessionNameWidth = getTextWidth(row.name)
            maxWidth = sessionNameWidth > maxWidth ? sessionNameWidth : maxWidth
          })
          maxWidth = Math.max(getTextWidth(columnNames[0]), maxWidth)
          break
        case 1: // Grades
          maxWidth = Math.max(getTextWidth(columnNames[1]), 'No Grade'.length, '✓100 / 100'.length)
          break
        case 2:
          maxWidth = getTextWidth(columnNames[2])
          break
        case 3:
          maxWidth = getTextWidth(columnNames[3])
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

    const StudentHeaderCell = () => {
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

    const OverallAverageHeaderCell = () => {
      return (
        <Cell>
          {columnNames[2]}
        </Cell>
      )
    }

    const OverallParticipationHeaderCell = () => {
      return (
        <Cell>
          {columnNames[3]}
        </Cell>
      )
    }

    const StudentCell = ({rowIndex}) => {
      const row = this.props.tableData[rowIndex]
      const student = _(this.props.students).findWhere({_id: row.studentId})
      const viewStudent = () => this.toggleProfileViewModal(student)

      return (
        <Cell onClick={viewStudent}>
          <div className='ql-grade-cell'>{row.name} </div>
        </Cell>
      )
    }

    const GradeCell = ({rowIndex}) => {
      const grade = this.props.tableData[rowIndex].grade
      let cellClass = 'ql-grade-cell'
      if (grade) {
        if (grade.hasUngradedMarks()) cellClass = 'ql-grade-cell-needs-grading'
      }

      const onClick = () => this.toggleGradeViewModal(grade)
      return (grade
          ? <Cell onClick={onClick}>
            <div className={cellClass}>
              {grade.joined ? '✓' : '✗'} {grade.participation.toFixed(0)}% / {grade.value.toFixed(0)}%
            </div>
          </Cell>
          : <Cell> No grade </Cell>
      )
    }

    const OverallAverageCell = ({rowIndex}) => {
      const studentId = this.props.tableData[rowIndex].studentId
      return (
        <Cell>
          {this.state.averages[studentId].toFixed(0)}%
        </Cell>
      )
    }

    const OverallParticipationCell = ({rowIndex}) => {
      const studentId = this.props.tableData[rowIndex].studentId
      return (
        <Cell>
          {this.state.participations[studentId].toFixed(0)}%
        </Cell>
      )
    }

    const showGradeViewModal = this.state.gradeViewModal && this.state.studentToView && !this.state.profileViewModal
    const showProfileViewModal = this.state.profileViewModal && this.state.studentToView && !this.state.gradeViewModal

    return (
      <div className='ql-grade-table-container' ref='gradeTableContainer'>
        <div className='ql-grade-table-controlbar'>
          {isInstructor
            ? <div className='ql-grade-table-controlbar-div'>
              <div>
                <div type='button' className='btn btn-secondary' onClick={this.calculateSessionGrades}>
                  Re-calculate grades for {this.props.session.name}
                </div>
              </div>
            </div>
            : ''
          }
        </div>
        <Table
          rowHeight={rowHeight}
          rowsCount={this.props.tableData.length}
          width={Math.min(getTableWidth(columnNames), 0.8 * window.innerWidth)}
          height={Math.min(rowHeight * (this.props.tableData.length) + headerHeight + 2, 0.7 * window.innerHeight)}
          headerHeight={headerHeight}>
          <Column
            header={<StudentHeaderCell />}
            cell={<StudentCell />}
            fixed
            width={getTextWidth(columnNames[0])}
          />
          <Column
            header={<GradeHeaderCell />}
            cell={<GradeCell />}
            fixed
            width={getTextWidth(columnNames[1])}
          />
          <Column
            header={<OverallAverageHeaderCell />}
            cell={<OverallAverageCell />}
            fixed
            width={getTextWidth(columnNames[2])}
          />
          <Column
            header={<OverallParticipationHeaderCell />}
            cell={<OverallParticipationCell />}
            fixed
            width={getTextWidth(columnNames[3])}
          />

        </Table>
        {showGradeViewModal
          ? <GradeViewModal
            grade={this.state.gradeToView}
            student={this.state.studentToView}
            done={this.toggleGradeViewModal} />
          : ''
        }
        {showProfileViewModal
          ? <ProfileViewModal
            user={this.state.studentToView}
            done={this.toggleProfileViewModal} />
          : ''
        }
      </div>
    )
  } // end render
}

// meteor reactive data container
export const SessionGradeTable = createContainer((props) => {
  const handle = Meteor.subscribe('users.studentsInCourse', props.courseId) &&
    Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('sessions.single', props.sessionId) &&
    Meteor.subscribe('grades.forSession', props.sessionId)

  const course = Courses.findOne(props.courseId)
  const session = Sessions.findOne({_id: props.sessionId})
  const grades = Grades.find({courseId: props.courseId, sessionId: props.sessionId}).fetch()

  let students

  if (course) {
    students = Meteor.users.find({ _id: { $in: course.students || [] } }).fetch()
    students = _(students).sortBy((entry) => { return entry.profile.lastname.toLowerCase() })
  }
  const tableData = []

  students.forEach((student) => {
    const result = _(grades).where({userId: student._id})
    const grade = result.length > 0 ? result[0] : null

    let participation = 0
    if (grades.length > 0) {
      participation = _(grades).reduce((total, grade) => {
        let gPart = 0
        if (grade && grade.participation) {
          gPart = grade.participation
        }
        return total + gPart
      }, 0) / grades.length
    }

    let dataItem = {
      studentId: student._id,
      name: student.profile.lastname + ', ' + student.profile.firstname,
      firstName: student.profile.firstname,
      lastName: student.profile.lastname,
      grade: grade,
      participation: participation
    }
    tableData.push(dataItem)
  })

  return {
    courseId: props.courseId,
    session: session,
    students: students,
    grades: grades,
    tableData: tableData,
    loading: !handle.ready()
  }
}, _SessionGradeTable)

SessionGradeTable.propTypes = {
  courseId: PropTypes.string.isRequired,
  sessionId: PropTypes.string.isRequired
}
