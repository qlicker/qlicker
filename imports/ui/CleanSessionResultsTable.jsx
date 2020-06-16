// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

import { CSVLink } from 'react-csv'

import { Courses } from '../api/courses'
import { Grades } from '../api/grades'
import { Questions } from '../api/questions'
import { Responses } from '../api/responses'

import {CleanTable} from './CleanTable'
import { GradeViewModal } from './modals/GradeViewModal'
import { ProfileViewModal } from './modals/ProfileViewModal'

export class _CleanSessionResultsTable extends Component {

  constructor (props) {
    super(props)

    this.state = {
      sortByColumn: 'last',
      sortAsc: true,
      studentSearchString: '',
      gradeViewModal: false,
      profileViewModal: false
    }

    this.calculateGrades = this.calculateGrades.bind(this)
    this.setSortByColumn = this.setSortByColumn.bind(this)
    this.setStudentSearchString = this.setStudentSearchString.bind(this)
    this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
  }

  setSortByColumn (colId) {
    let sortAsc = (colId === this.state.sortByColumn) ? !this.state.sortAsc : true
    this.setState({ sortByColumn: colId, sortAsc: sortAsc })
  }

  setStudentSearchString (e) {
    this.setState({ studentSearchString: e.target.value })
  }

  calculateGrades () {
    if (confirm('Are you sure?')) {
      Meteor.call('grades.calcSessionGrades', this.props.session._id, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Grades calculated')
        }
      })
    }
  }

  toggleGradeViewModal (gradeToView = null, studentToViewName = '') {
    this.setState({ gradeViewModal: !this.state.gradeViewModal, gradeToView: gradeToView, studentToViewName: studentToViewName })
  }

  toggleProfileViewModal (studentToView = null) {
    this.setState({ profileViewModal: !this.state.profileViewModal, studentToView: studentToView })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    if (!this.props.tableData || this.props.tableData.length < 1) return <div className='ql-subs-loading'>No students in course!</div>
    const session = this.props.session
    let tableData = this.props.tableData
    const isInstructor = Meteor.user().isInstructor(session.courseId)
    if ((!this.props.grades || this.props.grades.length < 1) && isInstructor) {
      return (<div>
        <div type='button' className='btn btn-secondary' onClick={this.calculateGrades}>
          Calculate grades
        </div>
      </div>)
    }

    const studentSearchString = this.state.studentSearchString
    const sortByColumn = this.state.sortByColumn
    const sortAsc = this.state.sortAsc

    const qIds = session ? session.questions : []
    const numQuestions = qIds.length
    const nQues = qIds.length

    let questions = []

    for (let i = 0; i < nQues; i++) {
      let question = _(this.props.questions).findWhere({_id: qIds[i]})
      _(question).extend({colName: 'Q' + (i + 1)})
      questions.push(question)
    }

    // Grab only the rows we need if the search string is set
    if (studentSearchString) {
      tableData = _(tableData).filter((entry) => {
        return entry.name.toLowerCase().includes(studentSearchString.toLowerCase()) ||
              entry.email.toLowerCase().includes(studentSearchString.toLowerCase())
      })
    }

    //Number of students has to be set after filtering!
    const nStu = tableData.length
    const csvFilename = this.props.session.name.replace(/ /g, '_') + '_results.csv'
    //First, generate the data for the CSV export (so that it's sorted by student last name)
    let csvHeaders = ["Last name", "First name", "Email", "grade", "participation"] //_(this.props.gradeHeaders).pluck('colName').slice(0,3)

    let csvRows = []
    for(let iStu = 0; iStu<nStu; iStu++){
      let tableRow = tableData[iStu]
      let participationGrade = tableRow.grade ? tableRow.grade.participation : 0
      let gradeValue = tableRow.grade ? tableRow.grade.value : 0
      let csvRow = [tableRow.lastName, tableRow.firstName, tableRow.email, gradeValue, participationGrade]

      for (let iQ = 0; iQ<nQues; iQ++){
        let q = questions[iQ]
        if(iStu == 0){
          csvHeaders.push(q.colName + ' response')
          csvHeaders.push(q.colName + ' points')
          csvHeaders.push(q.colName + ' outOfs')
        }

        if (tableRow.grade && tableRow.grade.marks){
          let m = _(tableRow.grade.marks).findWhere({questionId:q._id})
          let sresponse = _( _(tableRow.sresponses).where({questionId:q._id})).max(function(resp){return resp.attempt})
          csvRow.push(sresponse ? sresponse.answer : "")
          csvRow.push(m.points)
          csvRow.push(m.outOf)
        } else { //could happen for a student added to the course after the grades are calculated.
          csvRow.push("")
          csvRow.push(0)
          q.sessionOptions && q.sessionOptions.point ? csvRow.push(q.sessionOptions.points): csvRow.push(0)
        }
      }
      csvRows.push(csvRow)
    }
    
    // Sort if needed
    if (sortByColumn) {
      if (sortByColumn === 'name') {
        tableData = _(tableData).sortBy((entry) => { return entry.name.toLowerCase() })
      } else if (sortByColumn === 'participation') {
        tableData = _(tableData).sortBy((entry) => { return entry.grade.participation })
      } else if (sortByColumn === 'grade') {
        tableData = _(tableData).sortBy((entry) => { return entry.grade.value })
      } else {
        tableData = _(tableData).sortBy((entry) => {
          if(sortByColumn.includes('_response')){
            let qid = sortByColumn.split('_response')[0]
            let sresponse = _( _(entry.sresponses).where({questionId:qid})).max(function(resp){return resp.attempt})
            return (sresponse && sresponse.answer ? sresponse.answer : 'ZZZZZZZZZZZZZ') //just to be at the end if sorting on response and now response
          } else if(sortByColumn.includes('_points')){
            let qid = sortByColumn.split('_points')[0]
            const mark = _(entry.grade.marks).findWhere({ questionId: qid })
            return ((mark && mark.points) ? mark.points : 0)
          }
        })
      }
      if (!sortAsc) {
        tableData = tableData.reverse()
      }
    }

    //Define a component to hold a header that allows sorting
    const FancyHeader = ( {title, colSortName} ) => {
      const onClickSort = () => this.setSortByColumn(colSortName)
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn == colSortName) { //choose which way to point the sort button
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }

      return(
        <div className='ql-csrt-fancy-header'>
          <div className='ql-csrt-fancy-header-nolink'>
           {title}
          </div>
          { colSortName ?
            <div onClick={onClickSort} className='ql-csrt-fancy-header-sortbutton'>
             {nStu > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
            </div>
            :''
          }
        </div>
      )
    }

    // Create the array of FancyHeaders to pass to CleanTable
    let headers = []
    headers.push(<FancyHeader  colSortName = {'last'} title ={'Last name, first name'} />)
    headers.push(<FancyHeader  colSortName = {'email'} title ={'Email'} />)
    headers.push(<FancyHeader  colSortName = {'grade'} title ={'Grade'} />)
    headers.push(<FancyHeader  colSortName = {'participation'} title ={'Participation'} />)

    for (let iQ = 0; iQ<nQues; iQ++){
      headers.push(<FancyHeader colSortName = {questions[iQ]._id+'_response'} title={questions[iQ].colName+' response'} />)
      headers.push(<FancyHeader colSortName = {questions[iQ]._id+'_points'} title={questions[iQ].colName+' points' }/>)
    }

    //Define a component to hold cell data
    const FancyCell = ( {title, grade, participation, studentName, student} ) => {
      if (title){
        return(
          <div className='ql-csrt-fancy-cell'>
           {title}
          </div>
        )
      } else if(grade) {
        const onClick = () => this.toggleGradeViewModal(grade, studentName)
        return(
          <div className='ql-csrt-fancy-cell'>
            <div onClick={onClick} className='ql-csrt-fancy-cell-link'>
              {(participation ?
                   (grade.participation ? grade.participation : 0)
                 : (grade.value ? grade.value : 0 )
               )}
            </div>
          </div>
        )
      } else if(student) {
        const viewStudent = () => this.toggleProfileViewModal(student)
        return(
          <div className={'ql-csrt-fancy-cell'}>
            <div onClick={viewStudent} className={'ql-csrt-fancy-cell-link'}>
              {student.profile.lastname+', '+student.profile.firstname}
            </div>
          </div>
        )
      } else {
        return(
          <div className='ql-csrt-fancy-cell'>
           {0}
          </div>
        )
      }
    }
    //Fill rows of the display table
    let rows = []

    for(let iStu = 0; iStu<nStu; iStu++){
      let row = []
      row.push(<FancyCell student={tableData[iStu].student} />)
      row.push(<FancyCell title={tableData[iStu].email} />)
      let grade = tableData[iStu].grade
      if (grade){
        row.push(<FancyCell grade={grade} studentName={tableData[iStu].name} />)
        row.push(<FancyCell grade={grade} participation studentName={tableData[iStu].name}/>)
      } else {
        row.push(<FancyCell title={0} />)
        row.push(<FancyCell title={0} />)
      }


      for (let iQ = 0; iQ<nQues; iQ++){
        let questionId = questions[iQ]._id
        const mark = grade ? _(grade.marks).findWhere({questionId: questionId}) : null
        const attemptText = mark && mark.attempt > 0 ? '(attempt ' + mark.attempt + ')' : '(no attempt)'
        const sresponse = _( _(tableData[iStu].sresponses).where({questionId:mark.questionId})).max(function(resp){return resp.attempt})
        const pointsText= (mark ? mark.points.toFixed(2) :0) +'/'+ mark.outOf +' '+attemptText
        row.push(<FancyCell title={sresponse && sresponse.answer ? sresponse.answer : "N/A"} />)
        row.push(<FancyCell title={pointsText} />)
      }
      rows.push(row)
    }


    const goToGrade = () => Router.go('session.grade', {sessionId: this.props.session._id, courseId: this.props.session.courseId})
    const handleSubmit = (e) => { e.preventDefault() } // for student search form
    //Check to make sure only 1 modal open at a time:
    const showGradeViewModal = this.state.gradeViewModal && this.state.studentToViewName && !this.state.profileViewModal
    const showProfileViewModal = this.state.profileViewModal && this.state.studentToView && !this.state.gradeViewModal

    return (
      <div className='ql-grade-table-container' ref='gradeTableContainer'>
        <div className='ql-grade-table-controlbar'>
          {nStu > 1
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
                <div type='button' className='btn btn-secondary' onClick={goToGrade}>
                  Grade the session
                </div>
              </div>
              <div>
                <div type='button' className='btn btn-secondary' onClick={this.calculateGrades}>
                  Re-calculate grades
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
        <CleanTable rows={rows} headers={headers}  />
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
  }
}

export const CleanSessionResultsTable = withTracker((props) => {

  const handle = Meteor.subscribe('users.studentsInCourse', props.session.courseId) &&
    Meteor.subscribe('courses.single', props.session.courseId) &&
    Meteor.subscribe('sessions.single', props.session._id) &&
    Meteor.subscribe('grades.forSession', props.session._id) &&
    Meteor.subscribe('questions.forReview', props.session._id) &&
    Meteor.subscribe('responses.forSession', props.session._id)

  const course = Courses.findOne({ _id: props.session.courseId })
  const grades = Grades.find({ sessionId: props.session._id }).fetch()
  const questions = Questions.find({ sessionId: props.session._id }).fetch()
  const session = props.session
  const responses = session ? Responses.find({ questionId: { $in: session.questions } }).fetch() : []

  let students

  if (course) {
    students = Meteor.users.find({ _id: { $in: course.students || [] } }).fetch()
    students = _(students).sortBy((entry) => { return entry.profile.lastname.toLowerCase() })
  }
  const tableData = []
  const numStudents = students.length

  for (let iStu = 0; iStu < numStudents; iStu++) {
    let sgrade = _(grades).findWhere({ userId: students[iStu]._id, sessionId: session._id })
    let sresponses = _(responses).where({ studentUserId: students[iStu]._id })
    let dataItem = {
      name: students[iStu].profile.lastname + ', ' + students[iStu].profile.firstname,
      firstName: students[iStu].profile.firstname,
      lastName: students[iStu].profile.lastname,
      email: students[iStu].emails[0].address,
      userId: students[iStu]._id,
      student: students[iStu],
      grade: sgrade,
      sresponses: sresponses
    }
    tableData.push(dataItem)
  }

  return {
    questions: questions,
    grades: grades,
    tableData: tableData,
    session: session,
    done: () => {},
    loading: !handle.ready()
  }
})(_CleanSessionResultsTable)

CleanSessionResultsTable.propTypes = {
  session: PropTypes.object.isRequired
}
