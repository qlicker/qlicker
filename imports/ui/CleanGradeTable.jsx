import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'




import { CSVLink } from 'react-csv'

import { Courses } from '../api/courses'
import { Sessions } from '../api/sessions'
import { Grades } from '../api/grades'

import { GradeViewModal } from './modals/GradeViewModal'
import { ProfileViewModal } from './modals/ProfileViewModal'

import { CleanTable } from './CleanTable'


import { ROLES } from '../configs'


export class _CleanGradeTable extends Component {
  constructor (props) {
    super(props)
    this.state = { gradeViewModal: false,
      profileViewModal: false,
      studentSearchString: '',
      sortByColumn: 'name',
      sortAsc: true
    }
    this.calculateAllGrades = this.calculateAllGrades.bind(this)
    this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
    this.setStudentSearchString = this.setStudentSearchString.bind(this)
    this.setSortByColumn = this.setSortByColumn.bind(this)
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


   // Setup data for CSV downloader:
    let cvsHeaders = ['Last name', 'First name', 'Email', 'Particpation']

    sessions.forEach((s) => {
      cvsHeaders.push(s.name + ' Participation')
      cvsHeaders.push(s.name + ' Mark')
    })

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
        <CleanTable rows={csvData} headers={cvsHeaders} />

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
export const CleanGradeTable = withTracker((props) => {
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
})( _CleanGradeTable)

CleanGradeTable.propTypes = {
  courseId: PropTypes.string
}
