// QLICKER
// Author: Jacob Huschilt, Ryan Martin
//
// OverallGradeTable.jsx: Component for displaying grades from a given course and student

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

/**
 * React Component (meteor reactive) to display grades for a course.
 * @prop {Id} courseId - Id of course grades to show
 */
export class _OverallGradeTable extends Component {

  constructor (props) {
    super(props)

    this.state = {
      profileViewModal: false,
      gradeToView: null,
      average: 0,
      participation: 0,
      sessionParticipations: {},
      sessionAverages: {}
    }

    this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
    this.calculateAllGrades = this.calculateAllGrades.bind(this)
    this.calculateSessionGrades = this.calculateSessionGrades.bind(this)
  }

  componentWillReceiveProps (nextProps, nextContext) {
    Meteor.call('grades.forCourse.average', nextProps.courseId, (error, average) => {
      if (error) {
        alertify.error('Error calculating average')
      } else {
        this.setState({average: average})
      }
    })

    Meteor.call('grades.participation.average', nextProps.courseId, (error, participation) => {
      if (error) {
        alertify.error('Error calculating participation')
      } else {
        this.setState({participation: participation})
      }
    })

    nextProps.tableData.forEach((row) => {
      const session = row.session
      Meteor.call('grades.forSession.average', session._id, nextProps.courseId, null, (error, average) => {
        if (error) {
          alertify.error('Could not retrieve student average for: ' + session.name)
        } else {
          this.setState((state, props) => {
            let updatedSessionAverages = state.sessionAverages
            updatedSessionAverages[session._id] = average
            return {
              sessionAverages: updatedSessionAverages
            }
          })
        }
      })

      Meteor.call('grades.participation.forSession.average', session._id, nextProps.courseId, null, (error, participation) => {
        if (error) {
          alertify.error('Could not retrieve student average for: ' + session.name)
        } else {
          this.setState((state, props) => {
            let updatedSessionParticipation = state.sessionParticipations
            updatedSessionParticipation[session._id] = participation
            return {
              sessionParticipations: updatedSessionParticipation
            }
          })
        }
      })
    })
  }

  done (e) {
    this.props.done()
  }

  toggleGradeViewModal (gradeToView = null) {
    this.setState({
      gradeViewModal: !this.state.gradeViewModal,
      gradeToView: gradeToView,
    })
  }

  calculateSessionGrades (sessionId, sessionName) {
    if (confirm('Are you sure you want to re-calculate all student grades for ' + sessionName + '?')) {
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
    if (confirm('Are you sure re-calculate all course grades for all students?')) {
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
    const columnNames = ['Session Name', 'Grade', 'Participation']
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
          maxWidth = getTextWidth(columnNames[1])
          break
        case 2:
          maxWidth = getTextWidth(columnNames[2])
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

    const ParticipationHeaderCell = () => {
      return (
        <Cell>
          {columnNames[2]}
        </Cell>
      )
    }


    const SessionCell = ({rowIndex}) => {
      if (rowIndex === 0) { // Special Case: Overall Average
        return (
          <Cell>Course Average</Cell>
        )
      }

      const adjustedIndex = rowIndex - 1 >= 0 ? rowIndex - 1 : 0
      const row = this.props.tableData[adjustedIndex]
      const session = row.session
      const calcSessionGrades = () => this.calculateSessionGrades(session._id, session.name)
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

    const AverageCell = ({rowIndex}) => {
      if (rowIndex === 0) { // Special Case: Overall Average
        return (this.state.average !== null
            ? <Cell>
              {this.state.average.toFixed(0)}%
              </Cell>
            : <Cell> No Average </Cell>
        )
      }
      const adjustedIndex = rowIndex - 1 >= 0 ? rowIndex - 1 : 0
      const sessionId = this.props.tableData[adjustedIndex].session._id
      const average = this.state.sessionAverages[sessionId]

      return (average !== null && average !== undefined
          ? <Cell>
              {average.toFixed(0)}%
          </Cell>
          : <Cell> No grade </Cell>
      )
    }
    const ParticipationCell = ({rowIndex}) => {
      if (rowIndex === 0) { // Special Case: Overall Average
        return (this.state.participation !== null
            ? <Cell>
              {this.state.participation.toFixed(0)}%
              </Cell>
            : <Cell> No Average </Cell>
        )
      }
      const adjustedIndex = rowIndex - 1 >= 0 ? rowIndex - 1 : 0
      const sessionId = this.props.tableData[adjustedIndex].session._id
      const participation = this.state.sessionParticipations[sessionId]

      return (participation !== null && participation !== undefined
        ? <Cell>
          {participation.toFixed(0)}%
        </Cell>
        : <Cell> No grade </Cell>
      )
    }

    const showGradeViewModal = this.state.gradeViewModal && this.props.student && !this.state.profileViewModal

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
          rowsCount={this.props.tableData.length + 1}
          width={Math.min(getTableWidth(columnNames), 0.8 * window.innerWidth)}
          height={Math.min(rowHeight * (this.props.tableData.length + 1) + headerHeight + 2, 0.7 * window.innerHeight)}
          headerHeight={headerHeight}>
          <Column
            header={<SessionHeaderCell />}
            cell={<SessionCell />}
            fixed
            width={getTextWidth(columnNames[0])}
          />
          <Column
            header={<GradeHeaderCell />}
            cell={<AverageCell />}
            fixed
            width={getTextWidth(columnNames[1])}
          />
          <Column
            header={<ParticipationHeaderCell />}
            cell={<ParticipationCell />}
            fixed
            width={getTextWidth(columnNames[2])}
          />

        </Table>
        {showGradeViewModal
          ? <GradeViewModal
            grade={this.state.gradeToView}
            done={this.toggleGradeViewModal} />
          : ''
        }
      </div>
    )
  } // end render
}

// meteor reactive data container
export const OverallGradeTable = createContainer((props) => {
  const handle =
    Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('sessions.forCourse', props.courseId) &&
    Meteor.subscribe('grades.forCourse', props.courseId, {'marks': 0})

  const user = Meteor.user()
  const course = Courses.findOne(props.courseId)
  const grades = Grades.find({courseId: props.courseId}).fetch()

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
        let gPart = 0
        if (grade && grade.participation) {
          gPart = grade.participation
        }
        return total + gPart
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
    grades: grades,
    tableData: tableData,
    loading: !handle.ready()
  }
}, _OverallGradeTable)

OverallGradeTable.propTypes = {
  courseId: PropTypes.string.isRequired
}

