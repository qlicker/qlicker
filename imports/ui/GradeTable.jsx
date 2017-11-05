
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

/**
 * React Component (meteor reactive) to display Question object and send question reponses.
 * @prop {Id} courseId - Id of course to show
 */
export class _GradeTable extends Component {

  /**
   * setup Question display inital state.
   */
   constructor (props) {
     super(props)

     this.state = {gradeViewModal: false}
     this.calculateGrades = this.calculateGrades.bind(this)
     this.toggleGradeViewModal = this.toggleGradeViewModal.bind(this)
   }

  toggleGradeViewModal (gradeToView = null) {
    this.setState({ gradeViewModal: !this.state.gradeViewModal, gradeToView: gradeToView })
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

    const NameCell = ({rowIndex}) => <Cell>{ this.props.tableData[rowIndex].name }</Cell>
    const GradeCell = ({rowIndex, sessionId}) => {
      const grades = this.props.tableData[rowIndex].grades
      const grade = _(grades).findWhere({ sessionId: sessionId})
      const onClick = () => this.toggleGradeViewModal(grade)

      return (<Cell onClick = {onClick}>{ grade.participation.toFixed(0) } / { grade.value.toFixed(0) }</Cell>)
    }

    return (
      <div>
        <div onClick={this.calculateGrades} type='button' className='btn btn-secondary'>
          Recalculate course grades
        </div>
        <Table
          rowHeight={35}
          rowsCount={this.props.tableData.length}
          width={window.innerWidth - (window.innerWidth * 0.20)}
          height={window.innerHeight - (window.innerHeight * 0.30)}
          headerHeight={50}>
          <Column
            header={<Cell>Last, First</Cell>}
            cell={<NameCell />}
            fixed
            width={170}
          />
          { sessions.map((sess) =>
            <Column
              key={sess._id}
              header={<Cell onClick={_ => Router.go('session.results', { sessionId: sess._id })}><a href='#'>{sess.name}</a></Cell>}
              cell={<GradeCell sessionId={sess._id} />}
              width={getTextWidth(sess.name)}
            />
          ) }

        </Table>
        { this.state.gradeViewModal
          ? <GradeViewModal
            grade={this.state.gradeToView}
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
    students = Meteor.users.find({ _id: { $in: course.students || [] } }, { sort: { 'profile.lastname': 1 } }).fetch()

    const sessionQuery = { courseId: course._id }
    if (user.hasRole('student')) sessionQuery.status = { $ne: 'hidden' }
    sessions = Sessions.find(sessionQuery, { sort: { date: 1 } }).fetch()

  }

  const tableData = []
  const numStudents = students.length
  const numSessions = sessions.length

  for(let iStu = 0; iStu < numStudents; iStu++){
    let sgrades = _(grades).where({ userId: students[iStu]._id})
    let dataItem = {
      name: students[iStu].profile.lastname+', '+ students[iStu].profile.firstname,
      grades: sgrades
    }
    tableData.push(dataItem)
  }

  return {
    students: students,
    grades: grades,
    tableData: tableData,
    sessions: sessions,
    loading: !handle.ready()
  }
}, _GradeTable)


GradeTable.propTypes = {
  courseId: PropTypes.string
}
