import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'
import _ from 'underscore'

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
      sortByColumn: 'last', //default sort by last name (first column)
      sortAsc: true,
      studentSearchString: '',
      gradeViewModal: false,
      profileViewModal: false
    }

    this.setSortByColumn = this.setSortByColumn.bind(this)
    this.setStudentSearchString = this.setStudentSearchString.bind(this)
    this.calculateSessionGrades = this.calculateSessionGrades.bind(this)
    this.calculateAllGrades = this.calculateAllGrades.bind(this)
    this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
  }

  setStudentSearchString (e) {
    this.setState({ studentSearchString: e.target.value })
  }

  // Set as the sort column, toggle order if already the sort column, set to ascending otherwise
  setSortByColumn (colId) {
    let sortAsc = (colId === this.state.sortByColumn) ? !this.state.sortAsc : true
    this.setState({ sortByColumn: colId, sortAsc: sortAsc })
  }

  toggleGradeViewModal (gradeToView = null, studentToViewName = '') {
    this.setState({ gradeViewModal: !this.state.gradeViewModal, gradeToView: gradeToView, studentToViewName: studentToViewName })
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
    if (confirm('This will re-calculate all grades, leaving all manual overrides untouched. Are you sure?')) {
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
    if (!this.props.gradeRows|| this.props.gradeRows.length < 1 ) return <div className='ql-subs-loading'>No students in course!</div>

    const isInstructor = Meteor.user().isInstructor(this.props.courseId)
    const csvFilename = this.props.courseName.replace(/ /g, '_') + '_results.csv'

    let gradeRows = this.props.gradeRows
    let nStu = gradeRows.length
    const sessions = this.props.sessions
    const nSess =sessions.length

    //First, generate the data for the CSV export (so that it's sorted by student last name)
    let csvHeaders = ["Last name", "First name", "Email", "Avg. Participation"] //_(this.props.gradeHeaders).pluck('colName').slice(0,3)
    let csvRows = []

    for(let iStu = 0; iStu < nStu; iStu++){
      let csvRow = [gradeRows[iStu][0].first, gradeRows[iStu][0].last, gradeRows[iStu][0].email, gradeRows[iStu][0].avgParticipation ]
      for(let iSess = 0; iSess <nSess; iSess++){
        let grade = gradeRows[iStu][1+iSess] // + 1 because of last, first, email
        if(iStu ==0 ){
          csvHeaders.push(grade.name+' mark')
          csvHeaders.push(grade.name+' particip.')
        }
        csvRow.push( grade && grade.value ?Math.round(10*grade.value)/10 : 0)
        csvRow.push( grade && grade.participation ? Math.round(10*grade.participation)/10 : 0)
      }
      csvRows.push(csvRow)
    }

    const studentSearchString = this.state.studentSearchString
    if (studentSearchString) {
      gradeRows = _(gradeRows).filter((entry) => {
        return entry[0].first.toLowerCase().includes(studentSearchString.toLowerCase()) ||
              entry[0].last.toLowerCase().includes(studentSearchString.toLowerCase()) ||
              entry[0].email.toLowerCase().includes(studentSearchString.toLowerCase())
      })
    }
    //update the number of students
    nStu = gradeRows.length

    //Apply any sorting to the gradeRows:
    const sortByColumn = this.state.sortByColumn
    const sortAsc = this.state.sortAsc

    // Sort if needed
    if (sortByColumn) {
      if (sortByColumn === 'last') {//Last, first, email
        gradeRows = _(gradeRows).sortBy((entry) => { return entry[0].last })
      } else if (sortByColumn === 'email') {
        gradeRows = _(gradeRows).sortBy((entry) => { return entry[0].email })
      } else if (sortByColumn === 'avgParticipation') {
        gradeRows = _(gradeRows).sortBy((entry) => { return entry[0].avgParticipation })
      } else {
        if (sortByColumn.includes('smark')){ // grade.values
          let sid = sortByColumn.split('_smark')[0]
          gradeRows = _(gradeRows).sortBy((entry) => {
            const grade = _(entry.slice(1)).findWhere({ sessionId: sid })
            return ((grade && grade.value) ? Math.round(10*grade.value)/10 : 0)
          })
        } else if (sortByColumn.includes('spart')){ // grade.participations
          let sid = sortByColumn.split('_spart')[0]
          gradeRows = _(gradeRows).sortBy((entry) => {
            const grade = _(entry.slice(1)).findWhere({ sessionId: sid })
            return ((grade && grade.participation) ? Math.round(10*grade.participation)/10 : 0)
          })
        } else { }
      }

      if (!sortAsc) {
        gradeRows = gradeRows.reverse()
      }
    }

    //Define a component to hold a header that allows sorting
    const FancySessionHeader = ( {session, title, colSortName, participation} ) => {

      const onClickSort = () => this.setSortByColumn(colSortName)
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn == colSortName) { //choose which way to point the sort button
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }

      if (session){
        const calcGrades = () => this.calculateSessionGrades(session._id)
        const viewSession = () => Router.go('session.results', { sessionId: session._id , courseId:this.props.courseId})
        const gradesCalculated = isInstructor && session.gradesCalculated()

        let extraClass = ''
        if (!session.reviewable) extraClass += ' ql-cgt-fancy-session-header-grey'

        return(
          <div className='ql-cgt-fancy-session-header'>
            <div onClick={viewSession} className={'ql-cgt-fancy-session-header-link'+extraClass}>
             {session.name + (participation ? ' particip.': ' mark')}
            </div>
            { isInstructor && !gradesCalculated ?
              <div  className='ql-cgt-fancy-session-header-calcButton'>
                <div onClick={calcGrades} className='glyphicon glyphicon-refresh'>  </div>
              </div>
              : ''
            }
            <div onClick={onClickSort} className='ql-cgt-fancy-session-header-sortbutton'>
             {nStu > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
            </div>
          </div>
      )} else if (title){
        return(
          <div className='ql-cgt-fancy-session-header'>
            <div className='ql-cgt-fancy-session-header-nolink'>
             {title}
            </div>
            <div onClick={onClickSort} className='ql-cgt-fancy-session-header-sortbutton'>
             {nStu > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
            </div>
          </div>
        )
      }
      else return(  <div className='ql-cgt-fancy-session-header'> Missing header </div>)
    }
    // Create the array of FancyHeaders to pass to CleanTable
    let headers = []
    headers.push(<FancySessionHeader  colSortName = {'last'} title ={'Last name, First name'} />)
    headers.push(<FancySessionHeader  colSortName = {'email'} title ={'Email'} />)
    headers.push(<FancySessionHeader  colSortName = {'avgParticipation'} title ={'Avg. Participation'} />)
    //Two columns per session (mark and participation)
    for (let iSess = 0; iSess<nSess; iSess++){
      headers.push(<FancySessionHeader session={sessions[iSess]} participation={false} colSortName = {sessions[iSess]._id+'_smark'}  />)
      headers.push(<FancySessionHeader session={sessions[iSess]} participation={true} colSortName = {sessions[iSess]._id+'_spart'} />)
    }

    //Define a component to hold cell data
    const FancyCell = ( {grade, title, participation, studentName, student} ) => {
      if (title){
        return(
          <div className='ql-cgt-fancy-cell'>
           {title}
          </div>
        )
      }else if(grade){
        let extraClassOuter = ''
        let extraClassInner = ''

        if (grade.needsGrading && grade.joined) extraClassOuter += ' ql-cgt-needs-grading'
        if (!grade.joined) extraClassInner += ' ql-cgt-fancy-cell-grey'

        const onClick = () => this.toggleGradeViewModal(grade, studentName)
        return(
          <div className={'ql-cgt-fancy-cell'+extraClassOuter}>
            <div onClick={onClick} className={'ql-cgt-fancy-cell-link'+extraClassInner}>
              {(participation ?
                   (grade.participation ? Math.round(10*grade.participation)/10 : 0)
                 : (grade.value ? Math.round(10*grade.value)/10 : 0 )
               )}
            </div>
          </div>
        )
      } else if(student) {
        const viewStudent = () => this.toggleProfileViewModal(student)
        return(
          <div className={'ql-cgt-fancy-cell'}>
            <div onClick={viewStudent} className={'ql-cgt-fancy-cell-link'}>
              {student.profile.lastname+', '+student.profile.firstname}
            </div>
          </div>
        )
      } else {
        return(
          <div className='ql-cgt-fancy-cell'>
           {0}
          </div>
        )
      }
    }
    // Fill in the rows
    let rows = []
    for(let iStu = 0; iStu < nStu; iStu++){
      let row = []
      let studentName = gradeRows[iStu][0].last + ', ' + gradeRows[iStu][0].first

      row.push(isInstructor
                ? <FancyCell student={gradeRows[iStu][0].student} />
                : <FancyCell title={studentName}  />)
      row.push(<FancyCell title={gradeRows[iStu][0].email} />)
      row.push(<FancyCell title={gradeRows[iStu][0].avgParticipation} />)

      for(let iSess = 0; iSess <nSess; iSess++){
        let grade = gradeRows[iStu][1+iSess] // 1+ because of last, first, email etc stored in [0]
        row.push(<FancyCell grade={grade} studentName={studentName} />)
        row.push(<FancyCell grade={grade} studentName={studentName} participation={true} />)
      }
      rows.push(row)
    }

    //Check to make sure only 1 modal open at a time:
    const showGradeViewModal = this.state.gradeViewModal && this.state.studentToViewName && !this.state.profileViewModal
    const showProfileViewModal = this.state.profileViewModal && this.state.studentToView && !this.state.gradeViewModal
    const handleSubmit = (e) => { e.preventDefault() } // for student search form

    return (
      <div className='ql-grade-table-container' ref='gradeTableContainer'>
        <div className='ql-grade-table-controlbar'>
          {isInstructor
            ? <div className='ql-grade-table-controlbar-div'>
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
                <CSVLink data={csvRows} headers={csvHeaders} filename={csvFilename}>
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

        { showGradeViewModal
          ? <GradeViewModal
              grade={this.state.gradeToView}
              studentName={this.state.studentToViewName}
              done={this.toggleGradeViewModal}
             />
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
  //don't load all of these grade fields
  const gradeFields = {marks:0, numAnswered:0, numAnsweredTotal:0, numQuestions:0, numQuestionsTotal:0, outOf:0, automatic:0, points:0}

  //TODO: Try a new session subscription based on an array, to speed it up
  // TODO: Same but for the grades, based on an array of sessions
  const handle = Meteor.subscribe('users.studentsInCourse', props.courseId) &&
    Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('sessions.forCourse', props.courseId) &&
    Meteor.subscribe('grades.forCourse', props.courseId, gradeFields )

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

  let gradeRows = [] //table of grade objects (half as many columns)
  const numStudents = students.length
  const numSessions = sessions.length

  //Add grade data to a table, calculate average participation grade
  for (let iStu = 0; iStu < numStudents; iStu++) {
    //First entry has name, and avg participation
    let gradeRow = [{last: students[iStu].profile.lastname,
                     first:students[iStu].profile.firstname,
                     email:students[iStu].emails[0].address.toLowerCase(),
                     student:students[iStu],
                     avgParticipation: 0, //update this below
                     id:students[iStu]._id}]

    let sgrades =  _(grades).where({userId: students[iStu]._id})
    let participation = 0

    for (let iSess = 0; iSess < numSessions; iSess++) {
      let gpart = 0
      if(sgrades){
        let session = sessions[iSess]
        let grade = _(sgrades).findWhere( {sessionId:session._id} )

        if (grade) {
          gpart = grade.participation ? grade.participation : 0
          //If session name was changed after grade was created, grade name is not up to date
          if (grade.name != session.name) {
            grade.name = session.name
          }
          gradeRow.push(grade)
        } else {
          gradeRow.push(0)
        }
      }
      participation += gpart
    }
    participation = (numSessions == 0 ? 0 : Math.round(10*participation/numSessions)/10 )
    if( participation ) gradeRow[0].avgParticipation = participation
    gradeRows.push(gradeRow)
  }

  return {
    sessions: sessions, // used to get the names (and ids for clickable links)
    gradeRows: gradeRows,
    courseName: course.name, //used for CSV filename output
    loading: !handle.ready()
  }

})( _CleanGradeTable)

CleanGradeTable.propTypes = {
  courseId: PropTypes.string.isRequired,
  studentIds: PropTypes.array.isRequired,
  sessionIds: PropTypes.array.isRequired
}
