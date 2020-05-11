// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
//import { _ } from 'underscore'

import {Table, Column, Cell} from 'fixed-data-table-2'
import 'fixed-data-table-2/dist/fixed-data-table.css'

import { CSVLink } from 'react-csv'

import { Courses } from '../api/courses'
import { Grades } from '../api/grades'
import { Questions } from '../api/questions'
import { Responses } from '../api/responses'

import { GradeViewModal } from './modals/GradeViewModal'
import { ProfileViewModal } from './modals/ProfileViewModal'

export class _SessionResultsTable extends Component {

  constructor (props) {
    super(props)

    this.state = {
      gradeViewModal: false,
      profileViewModal: false,
      studentSearchString: '',
      sortByColumn: 'name',
      sortAsc: true
    }
    this.setStudentSearchString = this.setStudentSearchString.bind(this)
    this.setSortByColumn = this.setSortByColumn.bind(this)
    this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
    this.calculateGrades = this.calculateGrades.bind(this)
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

  toggleGradeViewModal (gradeToView = null) {
    const studentToView = _(this.props.students).findWhere({ _id: gradeToView.userId })
    this.setState({ gradeViewModal: !this.state.gradeViewModal, gradeToView: gradeToView, studentToView: studentToView })
  }

  toggleProfileViewModal (studentToView = null) {
    this.setState({ profileViewModal: !this.state.profileViewModal, studentToView: studentToView })
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

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    if (!this.props.students || this.props.students.length < 1) return <div className='ql-subs-loading'>No students in course!</div>
    const session = this.props.session
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
    let questions = []

    for (let i = 0; i < numQuestions; i++) {
      let question = _(this.props.questions).findWhere({_id: qIds[i]})
      _(question).extend({colName: 'Q' + (i + 1)})
      questions.push(question)
    }

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
        tableData = _(tableData).sortBy((entry) => { return entry.grade.participation })
      } else if (sortByColumn === 'grade') {
        tableData = _(tableData).sortBy((entry) => { return entry.grade.value })
      } else {
        tableData = _(tableData).sortBy((entry) => {
          const mark = _(entry.grade.marks).findWhere({ questionId: sortByColumn })
          return ((mark && mark.points) ? mark.points : 0)
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
    const GradeHeaderCell = ({rowIndex}) => {
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn === 'grade') {
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      sortButtonClass += ' ql-grade-table-sort-button'
      const onClickSort = () => this.setSortByColumn('grade')
      return (
        <Cell>
          {nRows > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
          Grade
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

    const QuestionHeaderCell = ({questionId}) => {
      const question = _(questions).findWhere({ _id: questionId })

      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn === questionId) {
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      sortButtonClass += ' ql-grade-table-sort-button'
      const onClickSort = () => this.setSortByColumn(questionId)
      return (
        <Cell>
          {nRows > 1 ? <div className={sortButtonClass} onClick={onClickSort} /> : '' }
          {question.colName}
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

    const ParticipationCell = ({rowIndex}) => {
      const participation = tableData[rowIndex].grade && tableData[rowIndex].grade.participation
                          ? tableData[rowIndex].grade.participation.toFixed(0)
                          : 0
      return (
        <Cell>
          { participation }
        </Cell>
      )
    }

    const GradeCell = ({rowIndex}) => {
      const grade = tableData[rowIndex].grade
      let cellClass = 'ql-grade-cell'
      if (grade) {
        if (grade.hasManualMarks()) cellClass = 'ql-grade-cell-manual'
        if (grade.hasUngradedMarks()) cellClass = 'ql-grade-cell-needs-grading'
      }

      const onClick = () => this.toggleGradeViewModal(grade)
      return (grade
              ? <Cell onClick={onClick}>
                <div className={cellClass}>
                  { tableData[rowIndex].grade.value.toFixed(0) }
                </div>
              </Cell>
              : <Cell> no grade </Cell>
      )
    }

    const QuestionCell = ({rowIndex, questionId}) => {
      const grade = tableData[rowIndex].grade
      const mark = grade ? _(grade.marks).findWhere({questionId: questionId}) : null
      const attemptText = mark && mark.attempt > 0 ? '(attempt ' + mark.attempt + ')' : '(no attempt)'
      return (mark
        ? <Cell>
          <div>
            {mark.points.toFixed(2)} / {mark.outOf} {attemptText}
          </div>
        </Cell>
        : <Cell > No mark </Cell>
      )
    }

   // Setup data for CSV downloader:
    let cvsHeaders = ['Last name', 'First name', 'Email', 'Particpation', 'Grade']

    questions.forEach((q) => {
      cvsHeaders.push(q.colName + ' response')
      cvsHeaders.push(q.colName + ' points')
      cvsHeaders.push(q.colName + ' outOfs')
    })

    let csvData = this.props.tableData.map((tableRow) => {
      if (!tableRow.grade) return []

      let participationGrade = tableRow.grade.participation
      let gradeValue = tableRow.grade.value
      let row = [tableRow.lastName, tableRow.firstName, tableRow.email, participationGrade, gradeValue]
      tableRow.grade.marks.forEach((m) => {
        let sresponse = _( _(tableRow.sresponses).where({questionId:m.questionId})).max(function(resp){return resp.attempt})
        row.push(sresponse ? sresponse.answer : "")
        row.push(m.points)
        row.push(m.outOf)
      })
      return row
    })
    const cvsFilename = this.props.session.name.replace(/ /g, '_') + '_results.csv'



    const handleSubmit = (e) => { e.preventDefault() }
    const goToGrade = () => Router.go('session.grade', {sessionId: this.props.session._id, courseId: this.props.session.courseId})
    const showGradeViewModal = this.state.gradeViewModal && this.state.studentToView && !this.state.profileViewModal
    const showProfileViewModal = this.state.profileViewModal && this.state.studentToView && !this.state.gradeViewModal
    return (
      <div className='ql-grade-table-container' ref='gradeTableContainer'>
        <div className='ql-grade-table-controlbar'>
          {this.props.students.length > 1
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
          height={0.35 * window.innerHeight}
          headerHeight={50}>
          <Column
            header={<NameHeaderCell />}
            cell={<NameCell />}
            fixed
            width={170}
          />
          <Column
            header={<GradeHeaderCell />}
            cell={<GradeCell />}
            width={110}
          />
          <Column
            header={<ParticipationHeaderCell />}
            cell={<ParticipationCell />}
            width={110}
          />
          { questions.map((q) =>
            <Column
              key={q._id}
              header={<QuestionHeaderCell questionId={q._id} />}
              cell={<QuestionCell questionId={q._id} />}
              width={140}
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
  }
}

export const SessionResultsTable = createContainer((props) => {
  /*
  const handle = Meteor.subscribe('users.myStudents', { cId: props.session.courseId }) &&
    Meteor.subscribe('courses') &&
    Meteor.subscribe('questions.forReview', props.session._id) &&
    Meteor.subscribe('grades.forSession', props.session._id)
*/

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
      grade: sgrade,
      sresponses: sresponses
    }
    tableData.push(dataItem)
  }

  return {
    students: students,
    questions: questions,
    grades: grades,
    tableData: tableData,
    session: session,
    done: () => {},
    loading: !handle.ready()
  }
}, _SessionResultsTable)

SessionResultsTable.propTypes = {
  session: PropTypes.object.isRequired
}
