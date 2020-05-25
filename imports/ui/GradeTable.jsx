
// QLICKER
// Author: Ryan Martin
//
// GradeTable.jsx: Component for displaying grades from a course

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'
//
//import { _ } from 'underscore'

import {Table, Column, Cell} from 'fixed-data-table-2'
import 'fixed-data-table-2/dist/fixed-data-table.css'

import { CSVLink } from 'react-csv'

import { Courses } from '../api/courses'
import { Sessions } from '../api/sessions'
import { Grades } from '../api/grades'

import { GradeViewModal } from './modals/GradeViewModal'
import { ProfileViewModal } from './modals/ProfileViewModal'

import { ROLES } from '../configs'

/**
 * React Component (meteor reactive) to display Question object and send question reponses.
 * @prop {Id} courseId - Id of course to show
 */
export class _GradeTable extends Component {

  constructor (props) {
    super(props)

    this.state = { gradeViewModal: false,
      profileViewModal: false,
      studentSearchString: '',
      sortByColumn: 'name',
      sortAsc: true
    }
    this.calculateAllGrades = this.calculateAllGrades.bind(this)
    this.calculateSessionGrades = this.calculateSessionGrades.bind(this)
    this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
    this.setStudentSearchString = this.setStudentSearchString.bind(this)
    this.setSortByColumn = this.setSortByColumn.bind(this)
  }

  done (e) {
    this.refs.searchStudentForm.reset()
    this.props.done()
  }

  toggleGradeViewModal (gradeToView = null) {
    const studentToView = _(this.props.students).findWhere({ _id: gradeToView.userId })
    this.setState({ gradeViewModal: !this.state.gradeViewModal, gradeToView: gradeToView, studentToView: studentToView })
  }

  toggleProfileViewModal (studentToView = null) {
    this.setState({ profileViewModal: !this.state.profileViewModal, studentToView: studentToView })
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
      const sessions = this.props.sessions
      for (let i = 0; i < sessions.length; i++) {
        Meteor.call('grades.calcSessionGrades', sessions[i]._id, (err) => {
          if (err) {
            alertify.error('Error: ' + err.error)
          } else {
            alertify.success('Grades calculated for ' + sessions[i].name)
          }
        })
      }
    }
  }

  setStudentSearchString (e) {
    this.setState({ studentSearchString: e.target.value })
  }

  // Set as the sort column, toggle order if already the sort column, set to ascending otherwise
  // Expects either a sessionId for the column, or the string 'name' if sorting by name
  setSortByColumn (colName) {
    let sortAsc = (colName === this.state.sortByColumn) ? !this.state.sortAsc : true

    this.setState({ sortByColumn: colName, sortAsc: sortAsc })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    if (!this.props.students || this.props.students.length < 1) return <div className='ql-subs-loading'>No students in course!</div>

    const sessions = this.props.sessions
    const isInstructor = Meteor.user().isInstructor(this.props.courseId)

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
      const width = (context.measureText(text).width + 30)
      if (width < 110) return 110
      else if (width > 300) return 300
      else return width
    }

    const studentSearchString = this.state.studentSearchString
    const sortByColumn = this.state.sortByColumn
    const sortAsc = this.state.sortAsc

    // Grab only the rows we need if the search string is set
    let tableData = studentSearchString
      ? _(this.props.tableData).filter((entry) => {
        return entry.name.toLowerCase().includes(studentSearchString.toLowerCase()) ||
              entry.email.toLowerCase().includes(studentSearchString.toLowerCase())
      })
      : this.props.tableData

    // Sort if needed
    if (sortByColumn) {
      if (sortByColumn === 'name') {
        tableData = _(tableData).sortBy((entry) => { return entry.name.toLowerCase() })
      } else if (sortByColumn === 'participation') {
        tableData = _(tableData).sortBy((entry) => { return entry.participation })
      } else {
        tableData = _(tableData).sortBy((entry) => {
          const grade = _(entry.grades).findWhere({ sessionId: sortByColumn })
          return ((grade && grade.value) ? grade.value : 0)
        })
      }
      if (!sortAsc) {
        tableData = tableData.reverse()
      }
    }

    const nRows = tableData.length

    const NameHeaderCell = ({rowIndex}) => {
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn === 'name') {
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      sortButtonClass += ' ql-grade-table-sort-button'
      const onClickSort = () => this.setSortByColumn('name')
      return (
        <Cell>
          {nRows > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
          Last, First
        </Cell>
      )
    }

    const ParticipationHeaderCell = ({rowIndex}) => {
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn === 'participation') {
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      sortButtonClass += ' ql-grade-table-sort-button'
      const onClickSort = () => this.setSortByColumn('participation')
      return (
        <Cell>
          {nRows > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
          Participation
        </Cell>
      )
    }

    const SessionHeaderCell = ({sessionId}) => {
      const session = _(sessions).findWhere({ _id: sessionId })
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn === sessionId) {
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      sortButtonClass += ' ql-grade-table-sort-button'
      const onClickSort = () => this.setSortByColumn(sessionId)
      const calcSessionGrades = () => this.calculateSessionGrades(sessionId)
      const viewSession = () => Router.go('session.results', { sessionId: sessionId , courseId:this.props.courseId})
      const headerClass = session.gradesViewable()
                            ? 'ql-grade-table-session-header'
                            : 'ql-grade-table-session-header hidden-from-students'
      // TODO: Dropdown does not work because of CSS for fixed table data
      /*
      const options = [ {name:'view', click:viewSession},
                        {name:'sort', click:onClickSort},
                        {name:'calculate grades', click:calcSessionGrades}
                      ]
      */
      return (
        <Cell>
          {nRows > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
          <div className={headerClass} onClick={viewSession} >{session.name} </div>
          {isInstructor ? <div onClick={calcSessionGrades} className='glyphicon glyphicon-repeat ql-grade-table-grade-calc-button' /> : ''}
        </Cell>
      )
    }

    const NameCell = ({rowIndex}) => {
      const student = _(this.props.students).findWhere({ _id: tableData[rowIndex].userId })
      const viewStudent = () => this.toggleProfileViewModal(student)
      return (
        <Cell onClick={viewStudent}>
          <div className='ql-grade-cell'>
            { tableData[rowIndex].name }
          </div>
        </Cell>
      )
    }

    const ParticipationCell = ({rowIndex}) => <Cell>{ tableData[rowIndex].participation.toFixed(0) } </Cell>

    const GradeCell = ({rowIndex, sessionId}) => {
      const grades = tableData[rowIndex].grades
      const grade = _(grades).findWhere({sessionId: sessionId})
      let cellClass = 'ql-grade-cell'
      if (grade) {
        //if (grade.hasManualMarks()) cellClass = 'ql-grade-cell-manual'
        if (grade.hasUngradedMarks()) cellClass = 'ql-grade-cell-needs-grading'
      }

      const onClick = () => this.toggleGradeViewModal(grade)
      return (grade
        ? <Cell onClick={onClick}>
          <div className={cellClass}>
            {grade.joined ? '✓' : '✗'} { grade.participation.toFixed(0) } / { grade.value.toFixed(0) }
          </div>
        </Cell>
        : <Cell > No grade </Cell>
      )
    }

   // Setup data for CSV downloader:
    let cvsHeaders = ['Last name', 'First name', 'Email', 'Particpation']

    sessions.forEach((s) => {
      cvsHeaders.push(s.name + ' Participation')
      cvsHeaders.push(s.name + ' Mark')
    })

    /*
    let csvData = this.props.tableData.map((tableRow) => {
      let row = [tableRow.lastName, tableRow.firstName, tableRow.email, tableRow.participation]
      tableRow.grades.forEach((g) => {
        row.push(g.participation)
        row.push(g.value)
      })
      return row
    })
    */
    let csvData = []
    for(let istu=0; istu<this.props.tableData.length ;istu++){
      const tableRow = this.props.tableData[istu]
      let row = [tableRow.lastName, tableRow.firstName, tableRow.email, tableRow.participation]
      for (let isess=0; isess<this.props.sessions.length ; isess++){
        const sessionId = this.props.sessions[isess]._id
        const grade = _(tableRow.grades).findWhere({sessionId: sessionId})
        if (grade){
          row.push(grade.participation)
          row.push(grade.value)
        } else {
          row.push(0)
          row.push(0)
        }
      }
      csvData.push(row)
    }

    const cvsFilename = this.props.courseName.replace(/ /g, '_') + '_results.csv'
    const handleSubmit = (e) => { e.preventDefault() }

    const showGradeViewModal = this.state.gradeViewModal && this.state.studentToView && !this.state.profileViewModal
    const showProfileViewModal = this.state.profileViewModal && this.state.studentToView && !this.state.gradeViewModal

    return (
      <div className='ql-grade-table-container' ref='gradeTableContainer'>
        <div className='ql-grade-table-controlbar'>
          {this.props.students.length > 1
            ? <div className='ql-grade-table-controlbar-divh'>
              <form ref='searchStudentForm' onSubmit={handleSubmit}>
                <input type='text' maxLength='32' size='32' placeholder='search by student name or email' onChange={_.throttle(this.setStudentSearchString, 200)} />
              </form>
            </div>
            : ''
          }
          {isInstructor
            ? <div className='ql-grade-table-controlbar-div'>
              <div>
                <div type='button' className='btn btn-secondary' onClick={this.calculateAllGrades}>
                  Re-calculate all grades
                </div>
              </div>
              <div>
                <CSVLink data={csvData} headers={cvsHeaders} filename={cvsFilename}>
                  <div type='button' className='btn btn-secondary'>
                    Export as .csv
                  </div>
                </CSVLink>
              </div>
            </div>
            : ''
          }
        </div>
        <Table
          rowHeight={35}
          rowsCount={nRows}
          width={0.8 * window.innerWidth}
          height={0.7 * window.innerHeight}
          headerHeight={50}>
          <Column
            header={<NameHeaderCell />}
            cell={<NameCell />}
            fixed
            width={170}
          />
          <Column
            header={<ParticipationHeaderCell />}
            cell={<ParticipationCell />}
            width={110}
          />
          { sessions.map((sess) =>
            <Column
              key={sess._id}
              header={<SessionHeaderCell sessionId={sess._id} />}
              cell={<GradeCell sessionId={sess._id} />}
              width={getTextWidth(sess.name)}
            />
          ) }

        </Table>
        { showGradeViewModal
          ? <GradeViewModal
            grade={this.state.gradeToView}
            student={this.state.studentToView}
            done={this.toggleGradeViewModal} />
          : '' }
        { showProfileViewModal
          ? <ProfileViewModal
            user={this.state.studentToView}
            done={this.toggleProfileViewModal} />
          : '' }
      </div>
    )
  } // end render
}

// meteor reactive data container
export const GradeTable = withTracker((props) => {
  const handle = Meteor.subscribe('users.studentsInCourse', props.courseId) &&
    Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('sessions.forCourse', props.courseId) &&
    Meteor.subscribe('grades.forCourse', props.courseId, {'marks':0} )
  //{value: 1, participation: 1, userId: 1, sessionId:1, joined:1, needsGrading:1}
  const user = Meteor.user()
  const course = Courses.findOne(props.courseId)
  const grades = Grades.find({ courseId: props.courseId }).fetch()

  let students, sessions

  if (course) {
    students = Meteor.users.find({ _id: { $in: course.students || [] } }).fetch()
    students = _(students).sortBy((entry) => { return entry.profile.lastname.toLowerCase() })

    const sessionQuery = { courseId: course._id }
    if (!user.hasGreaterRole(ROLES.admin) && !user.isInstructor(props.courseId)) {
      sessionQuery.status = { $ne: 'hidden' }
      sessionQuery.reviewable = true
    }
    sessions = Sessions.find(sessionQuery, { sort: { date: 1 } }).fetch()
  }

  const tableData = []
  const numStudents = students.length

  for (let iStu = 0; iStu < numStudents; iStu++) {
    let sgrades = _(grades).where({userId: students[iStu]._id})

    let participation = 0
    if (sgrades.length > 0) {
      participation = _(sgrades).reduce((total, grade) => {
        let gpart = 0
        if (grade && grade.participation) {
          gpart = grade.participation
        }
        return total + gpart
      }, 0) / sgrades.length
    }

    let dataItem = {
      name: students[iStu].profile.lastname + ', ' + students[iStu].profile.firstname,
      firstName: students[iStu].profile.firstname,
      lastName: students[iStu].profile.lastname,
      userId: students[iStu]._id,
      email: students[iStu].emails[0].address,
      participation: participation,
      grades: sgrades
    }
    tableData.push(dataItem)
  }

  return {
    courseId: props.courseId,
    courseName: course.name,
    students: students,
    grades: grades,
    tableData: tableData,
    sessions: sessions,
    loading: !handle.ready()
  }
})( _GradeTable)

GradeTable.propTypes = {
  courseId: PropTypes.string
}
