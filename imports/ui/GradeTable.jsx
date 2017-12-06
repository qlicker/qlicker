
// QLICKER
// Author: Ryan Martin
//
// GradeTable.jsx: Component for displaying grades from a course

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
//
import { _ } from 'underscore'

import {Table, Column, Cell} from 'fixed-data-table-2'
import 'fixed-data-table-2/dist/fixed-data-table.css'

import { Courses } from '../api/courses'
import { Sessions } from '../api/sessions'
import { Grades } from '../api/grades'

import { Stats } from '../stats'
import { CourseResultsDownloader } from './CourseResultsDownloader'
import { GradeViewModal } from './modals/GradeViewModal'

import { ControlledForm } from './ControlledForm'

import { ROLES } from '../configs'


/**
 * React Component (meteor reactive) to display Question object and send question reponses.
 * @prop {Id} courseId - Id of course to show
 */
export class _GradeTable extends ControlledForm {

  /**
   * setup Question display inital state.
   */
   constructor (props) {
     super(props)

     this.state = { gradeViewModal: false,
                    studentSearchString: '',
                    sortByColumn: 'name',
                    sortAsc: true
                  }
     this.calculateGrades = this.calculateGrades.bind(this)
     this.calculateSessionGrades = this.calculateSessionGrades.bind(this)
     this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
     this.setStudentSearchString = this.setStudentSearchString.bind(this)
     this.setSortByColumn = this.setSortByColumn.bind(this)
   }

   done (e) {
     this.refs.searchStudentForm.reset()
     this.props.done()
   }

   toggleGradeViewModal (gradeToView = null) {
    const studentToView = _(this.props.students).findWhere({ _id:gradeToView.userId })
    this.setState({ gradeViewModal: !this.state.gradeViewModal, gradeToView: gradeToView, studentToView:studentToView })
   }

   calculateSessionGrades (sessionId) {
     Meteor.call('grades.calcSessionGrades',sessionId, (err) => {
       if(err){
         alertify.error('Error: ' + err.error)
       }
     })
   }

  calculateGrades () {
    const sessions = this.props.sessions
    for(let i = 0; i<sessions.length; i++){
      Meteor.call('grades.calcSessionGrades',sessions[i]._id, (err) => {
        if(err){
          alertify.error('Error: ' + err.error)
        }
      })
    }
  }

  setStudentSearchString (e) {
    this.setState({ studentSearchString: e.target.value })
  }

  // Set as the sort column, toggle order if already the sort column, set to ascending otherwise
  // Expects either a sessionId for the column, or the string 'name' if sorting by name
  setSortByColumn (colName) {
    let sortAsc = (colName === this.state.sortByColumn) ? !this.state.sortAsc : true

    this.setState({ sortByColumn:colName, sortAsc:sortAsc })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const getTextWidth = (text) => {
      let element = document.createElement('canvas')
      let context = element.getContext('2d')
      const width = (context.measureText(text).width + 30)
      if (width < 110) return 110
      else if (width > 300) return 300
      else return width
    }

    const sessions = this.props.sessions
    const studentSearchString = this.state.studentSearchString
    const sortByColumn = this.state.sortByColumn
    const sortAsc = this.state.sortAsc
    const isInstructor = Meteor.user().isInstructor(this.props.courseId)

    // Grab only the rows we need if the search string is set
    let tableData = studentSearchString ?
      _(this.props.tableData).filter( (entry) => {return entry.name.toLowerCase().includes(studentSearchString.toLowerCase())} ):
      this.props.tableData

    // Sort if needed
    if (sortByColumn) {
      if (sortByColumn === 'name'){
        tableData = _(tableData).sortBy( (entry) => {return entry.name.toLowerCase()})
      } else if (sortByColumn === 'participation'){
        tableData = _(tableData).sortBy( (entry) => {return entry.participation})
      } else {
        tableData = _(tableData).sortBy( (entry) => {
          const grade = _(entry.grades).findWhere({ sessionId:sortByColumn })
          return ( (grade && grade.value) ? grade.value : 0 )
         })
      }
      if (!sortAsc){
        tableData = tableData.reverse()
      }
    }

    const nRows = tableData.length

      const NameHeaderCell = ({rowIndex}) => {
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn === 'name' ){
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      sortButtonClass +=' ql-grade-table-sort-button'
      const onClickSort =  () => this.setSortByColumn('name')
      return(
        <Cell>
          {nRows > 1 ? <div className={sortButtonClass} onClick={ onClickSort } /> : '' }
          Last, First
        </Cell>
      )
    }

    const ParticipationHeaderCell = ({rowIndex}) => {
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn === 'participation' ){
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      sortButtonClass +=' ql-grade-table-sort-button'
      const onClickSort =  () => this.setSortByColumn('participation')
      return(
        <Cell>
          {nRows > 1 ? <div className={sortButtonClass} onClick={ onClickSort } /> : '' }
          Participation
        </Cell>
      )
    }

    const SessionHeaderCell = ({sessionId}) => {
      const session = _(sessions).findWhere({ _id:sessionId })
      let sortButtonClass = 'glyphicon glyphicon-minus'
      if (sortByColumn === sessionId ){
        sortButtonClass = sortAsc ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-up'
      }
      sortButtonClass +=' ql-grade-table-sort-button'
      const onClickSort =  () => this.setSortByColumn(sessionId)
      const calcSessionGrades = () => this.calculateSessionGrades(sessionId)
      return (
        <Cell>
          {nRows > 1 ? <div className={sortButtonClass} onClick={onClickSort} />: '' }
          <div className='ql-grade-table-session-header' onClick={_ => Router.go('session.results', { sessionId: sessionId })} >{session.name} </div>
          {isInstructor ? <div onClick={calcSessionGrades} className='glyphicon glyphicon-repeat ql-grade-table-grade-calc-button' /> : ''}
        </Cell>
      )
    }

    const NameCell = ({rowIndex}) =>  <Cell>{ tableData[rowIndex].name } </Cell>

    const ParticipationCell =  ({rowIndex}) =>  <Cell>{ tableData[rowIndex].participation } </Cell>

    const GradeCell = ({rowIndex, sessionId}) => {
      const grades = tableData[rowIndex].grades
      const grade = _(grades).findWhere({ sessionId: sessionId})
      const onClick = () => this.toggleGradeViewModal(grade)
      return ( grade ?
        <Cell onClick = {onClick}>
          <div className='ql-grade-cell'>
            {grade.joined ? '✓' : '✗'} { grade.participation.toFixed(0) } / { grade.value.toFixed(0) }
          </div>
        </Cell> :
        <Cell > No grade </Cell>
      )
    }


    return (
      <div className='ql-grade-table-container' ref='gradeTableContainer'>
        {isInstructor ?
          <div onClick={this.calculateGrades} type='button' className='btn btn-secondary'>
            Recalculate course grades
          </div>
          : ''
        }
        {this.props.students.length > 1 ?
          <div>
            <form ref='searchStudentForm'>
              <input type='text' className='form-control search-field' placeholder='search by student 'onChange={_.throttle(this.setStudentSearchString, 500)} />
            </form>
           </div>
          : ''
        }

        <Table
          rowHeight={35}
          rowsCount={nRows}
          width={0.8 * window.innerWidth}
          height={0.7 * window.innerHeight }
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
        { this.state.gradeViewModal
          ? <GradeViewModal
              grade={this.state.gradeToView}
              student={this.state.studentToView}
              done={this.toggleGradeViewModal} />
          : '' }
      </div>
    )

  } // end render
}


// meteor reactive data container
export const GradeTable = createContainer((props) => {
  const handle = Meteor.subscribe('users.myStudents', {cId: props.courseId}) &&
    Meteor.subscribe('courses', {isInstructor: Meteor.user().isInstructor(props.courseId)}) &&
    Meteor.subscribe('sessions') &&
    Meteor.subscribe('grades.forCourse', props.courseId)

  const user = Meteor.user()
  const course = Courses.findOne(props.courseId)
  const grades = Grades.find({ courseId: props.courseId }).fetch()

  let students, sessions
  if (course) {
    students = Meteor.users.find({ _id: { $in: course.students || [] } }).fetch()
    students = _(students).sortBy( (entry) => {return entry.profile.lastname.toLowerCase()})

    const sessionQuery = { courseId: course._id }
    if (!user.hasGreaterRole(ROLES.admin) && !user.isInstructor(props.courseId)){
       sessionQuery.status = { $ne: 'hidden' }
       sessionQuery.reviewable = true
     }
    sessions = Sessions.find(sessionQuery, { sort: { date: 1 } }).fetch()

  }

  const tableData = []
  const numStudents = students.length
  const numSessions = sessions.length

  for(let iStu = 0; iStu < numStudents; iStu++){
    let sgrades = _(grades).where({ userId: students[iStu]._id})

    let participation = 0
    if (sgrades.length > 0){
      participation = _(sgrades).reduce( (total, grade) => {
        let gpart = 0
        if (grade && grade.participation){
          gpart = grade.participation
        }
        return total + gpart
      }, 0) / sgrades.length
    }

    let dataItem = {
      name: students[iStu].profile.lastname+', '+ students[iStu].profile.firstname,
      participation: participation.toFixed(0),
      grades: sgrades
    }
    tableData.push(dataItem)
  }

  return {
    courseId: props.courseId,
    students: students,
    grades: grades,
    tableData: tableData,
    sessions: sessions,
    done: () => {},
    loading: !handle.ready(),
  }
}, _GradeTable)


GradeTable.propTypes = {
  courseId: PropTypes.string
}
