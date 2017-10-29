
// QLICKER
// Author: Ryan Martin
//
// GradeTable.jsx: Component for displaying grades from a course

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
//
import { _ } from 'underscore'

import ReactTable from 'react-table'


import { Courses } from '../api/courses'
import { Sessions } from '../api/sessions'
import { Grades } from '../api/grades'

import { Stats } from '../stats'
import { CourseResultsDownloader } from './CourseResultsDownloader'
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

     this.state = {}
     this.renderStudent = this.renderStudent.bind(this)
     this.renderStudentGrades = this.renderStudentGrades.bind(this)
     this.calculateGrades = this.calculateGrades.bind(this)
     this.gradeValue = this.gradeValue.bind(this)
   }

  calculateGrades () {
    const sessions = this.props.sessionList
    for(let i = 0; i<sessions.length; i++){
      Meteor.call('grades.calcSessionGrades',sessions[i]._id, (err) => {
        if(err){
          alertify.error('Error: ' + err.error)
        }
      })
    }
  }

  renderStudent(stu){
    return(
        <div key={stu._id}> {stu.profile.lastname} </div>
    )
  }

  renderStudentGrades (stu) {
    const sessions = this.props.sessionList
    const grades = this.props.grades
    return(
        sessions.map( (sess) => {
          let gradeItem = _(grades).findWhere({ userId: stu._id, sessionId: sess._id})
          let gradeValue = 'no grade item'
          if(gradeItem){
            gradeValue = 0
            if(gradeItem.points>0){
              if(gradeItem.outOf > 0){
                gradeValue = 100*gradeItem.points/gradeItem.outOf
              }else{
                gradeValue=100
              }
            }
          }
           gradeItem ? (gradeItem.outOf ? 100*gradeItem.points/gradeItem.outOf : 100) : 'no grade item'
          return(
            <div key={'grade'+stu._id+sess._id}>
            {sess.name} : {gradeValue}
            </div>
          )
        })
    )
  }

  gradeValue (grade){
    let gradeValue = 'no grade item'
    if(grade){
      gradeValue = 0
      if(grade.points>0){

        if(grade.outOf > 0){
          gradeValue = 100*grade.points/grade.outOf
        }else{
          gradeValue=100
        }
      }
    }
    return gradeValue
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const students = this.props.students
    const sessions = this.props.sessionList
    const numSessions = sessions.length
    let columns = [{
      Header: 'Last Name, First Name',
      accessor: 'name'
    }]
    for(let iSes = 0; iSes < numSessions ; iSes++){
     let session = sessions[iSes]
     let cHeader = {
       id: 'sessionGrade',
       Header: session.name,
       accessor: (d) => {
         let grade = _(d.grades).findWhere({ sessionId: session._id})
         return this.gradeValue(grade)
       }
     }
     columns.push(cHeader)
   }


    return (
      <div>
        <ReactTable
          data={this.props.tableData}
          columns={columns}
        />

        <a onClick={this.calculateGrades}> Calculate course grades </a>
        {
          students.map( (stu) =>{
            return this.renderStudentGrades(stu)
          })
        }
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
  const grades = Grades.find({ courseId:props.courseId }).fetch()

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
    course: course,
    grades: grades,
    tableData: tableData,
    sessionList: sessions,
    sessionMap: _(sessions).indexBy('_id'),
    loading: !handle.ready()
  }
}, _GradeTable)


GradeTable.propTypes = {
  courseId: PropTypes.string
}
