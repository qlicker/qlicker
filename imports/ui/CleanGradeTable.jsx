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

    this.state = {
      sortByColumn: 0, //default sort by last name (first column)
      sortAsc: true
    }

    this.setSortByColumn = this.setSortByColumn.bind(this)
    this.calculateAllGrades = this.calculateAllGrades.bind(this)
  }

  // Set as the sort column, toggle order if already the sort column, set to ascending otherwise
  // Expects either a sessionId for the column, or the string 'name' if sorting by name
  setSortByColumn (colNumber) {
    let sortAsc = (colNumber == this.state.sortByColumn) ? !this.state.sortAsc : true

    this.setState({ sortByColumn: colNumber, sortAsc: sortAsc })

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

  render () {
    // The CSV download uses the tableRows and tableHeaders that are passed as props
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    if (!this.props.tableHeaders|| !this.props.tableRows || this.props.tableRows.length < 1 || this.props.tableHeaders.length < 1) return <div className='ql-subs-loading'>No students in course!</div>

    const isInstructor = Meteor.user().isInstructor(this.props.courseId)
    const csvFilename = this.props.courseName.replace(/ /g, '_') + '_results.csv'

    const sortByColumn = this.state.sortByColumn
    const sortAsc = this.state.sortAsc
    const nRows = this.props.tableRows.length



    let rows = this.props.tableRows
    // Sort if needed
    if (sortByColumn) {
      if (sortByColumn < 3) {//Last, first, email
        rows = _(rows).sortBy((entry) => { return entry[sortByColumn].toLowerCase() })
      } else {
        rows = _(rows).sortBy((entry) => { return entry[sortByColumn] })
      }
      if (!sortAsc) {
        rows = rows.reverse()
      }
    }

    const FancySessionHeader = ( {session, participation, colNumber, title} ) => {

      const viewSession = () => Router.go('session.results', { sessionId: session._id , courseId:this.props.courseId})
      const onClickSort = () => this.setSortByColumn(colNumber)

      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn == colNumber) {
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      //sortButtonClass += ' ql-cgt-fancy-session-header-sortbutton'

      if (session){
        return(
          <div className='ql-cgt-fancy-session-header'>
            <div onClick={viewSession} className='ql-cgt-fancy-session-header-link'>
             {session.name + (participation ? ' particip.': ' mark')}
            </div>
            <div onClick={onClickSort} className='ql-cgt-fancy-session-header-sortbutton'>
            {nRows > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
            </div>
          </div>
      )}
      else if (title){
        return(
          <div className='ql-cgt-fancy-session-header'>
            <div className='ql-cgt-fancy-session-header-nolink'>
             {title}
            </div>
            <div onClick={onClickSort} className='ql-cgt-fancy-session-header-sortbutton'>
            {nRows > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
            </div>
          </div>
        )
      }
      else return(  <div className='ql-cgt-fancy-session-header'> Missing header </div>)
      }



    //Make fancy headers for the sessions
    const nSess = this.props.sessions.length
    let colNumber = 0
    let headers = []
    headers.push(<FancySessionHeader  participation={true} colNumber = {colNumber} title ={'Last name'} />)
    colNumber += 1
    headers.push(<FancySessionHeader  participation={true} colNumber = {colNumber} title ={'First name'} />)
    colNumber += 1
    headers.push(<FancySessionHeader  participation={true} colNumber = {colNumber} title ={'Email'} />)
    colNumber += 1
    //Two columns per session (mark and participation)
    for (let iSess = 0; iSess<nSess; iSess++){
      headers.push(<FancySessionHeader session={this.props.sessions[iSess]} participation={false} colNumber = {colNumber}  />)
      colNumber += 1
      headers.push(<FancySessionHeader session={this.props.sessions[iSess]} participation={true} colNumber = {colNumber} />)
      colNumber += 1
    }
    headers.push(<FancySessionHeader  participation={true} colNumber = {colNumber} title ={'Avg. Participation'} />)
    //headers.push("Avg. Participation")

    return (
      <div className='ql-grade-table-container' ref='gradeTableContainer'>
        <div className='ql-grade-table-controlbar'>
          {isInstructor
            ? <div className='ql-grade-table-controlbar-div'>
              <div>
                <div type='button' className='btn btn-secondary' onClick={this.calculateAllGrades}>
                  Re-calculate all grades
                </div>
              </div>
              <div>
                <CSVLink data={this.props.tableRows} headers={this.props.tableHeaders} filename={csvFilename}>
                  <div type='button' className='btn btn-secondary'>
                    Export as .csv
                  </div>
                </CSVLink>
              </div>
            </div>
            : ''
          }
      </div>
        <CleanTable rows={rows} headers={headers} />
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
    students = Meteor.users.find({ _id: { $in: props.studentIds || [] } }).fetch()
    students = _(students).sortBy((entry) => { return entry.profile.lastname.toLowerCase() })

    const sessionQuery = { courseId: course._id }
    if (!user.hasGreaterRole(ROLES.admin) && !user.isInstructor(props.courseId)) {
      sessionQuery.status = { $ne: 'hidden' }
      sessionQuery.reviewable = true
    }
    sessionQuery._id ={ $in: props.sessionIds || [] }
    sessions = Sessions.find(sessionQuery, { sort: { date: 1 } }).fetch()
  }


  let tableRows = []
  const numStudents = students.length

  let tableHeaders = ["Last Name", "First Name", "Email"]
  const numSessions = sessions.length
  for (let iSess = 0; iSess < numSessions; iSess++) {
    tableHeaders.push(sessions[iSess].name+' mark')
    tableHeaders.push(sessions[iSess].name+' participation')
  }
  tableHeaders.push("Avg participation")
  //console.log(sessions)
  //console.log(grades)

  for (let iStu = 0; iStu < numStudents; iStu++) {
    let tableRow = [students[iStu].profile.lastname, students[iStu].profile.firstname, students[iStu].emails[0].address.toLowerCase()]

    let sgrades =  _(grades).where({userId: students[iStu]._id})
    let participation = 0

    for (let iSess = 0; iSess < numSessions; iSess++) {
      let gvalue = 0
      let gpart = 0
      if(sgrades){
        let grade = _(sgrades).findWhere( {sessionId:sessions[iSess]._id} )
        if (grade) {
          gvalue = grade.value
          gpart = grade.participation
        }
      }
      tableRow.push(gvalue)
      tableRow.push(gpart)
      participation += gpart
    }
    participation = numSessions == 0 ? 0 : Math.round(10*participation/numSessions)/10
    tableRow.push(participation)
    tableRows.push(tableRow)
  }

  return {
    sessions: sessions, //required to calculate all grades...
    tableRows: tableRows,
    tableHeaders: tableHeaders,
    courseName: course.name,
    loading: !handle.ready()
  }

})( _CleanGradeTable)

CleanGradeTable.propTypes = {
  courseId: PropTypes.string.isRequired,
  studentIds: PropTypes.array.isRequired,
  sessionIds: PropTypes.array.isRequired
}
