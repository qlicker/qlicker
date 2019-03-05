// QLICKER
// Author: Jacob Huschilt & Dennis So
//
// material_ui_table.jsx: Component for displaying grades from a course

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table'

import {Courses} from "../api/courses";
import {Grades} from "../api/grades";
import {Sessions} from "../api/sessions";
import {_} from "underscore";
import {ROLES} from "../configs";

class _MaterialUITable extends Component {

  render () {

    //console.log(this.props)
    //console.log(this.props.courseId)

    //helper function to populate grades array
    function createData(name, participateGrade, overallGrade) {
      let id =+ 1
      return { id, name, participateGrade, overallGrade }
    }

    const rows = []

    //populate grades array "rows"
    for (let i=0; i<this.props.tableData.length; i++){
      const tableRow = this.props.tableData[i]

      //console.log("userid:", tableRow.userId)
      //console.log(this.props.courseId, tableRow.userId)

      //ToDo: fix courseId in method call
      rows.push(createData(tableRow.firstName + " " + tableRow.lastName, tableRow.participation ,Meteor.call("grades.forCourse.average", [this.props.courseId, tableRow.userId])))
    }

    //console.log(rows)

    return (
      <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <div className='container'>

          <div className="input-group materialGradeTable-control">
            <div className="input-group-btn">
              <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="false">Sort By </button>
              <ul className="dropdown-menu">
                <li><a href="#">Assignment</a></li>
              </ul>
            </div>
            <input type="text" className="form-control" aria-label="..."></input>
          </div>

          <Table className='materialGradeTable'>
            <TableHeader>
              <TableRow>
                <TableHeaderColumn>Student Name</TableHeaderColumn>
                <TableHeaderColumn align="right">Participation</TableHeaderColumn>
                <TableHeaderColumn align="right">Overall Grade</TableHeaderColumn>
              </TableRow>
            </TableHeader>

            <TableBody>

              {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableRowColumn component="th" scope="row">
                      {row.name}
                    </TableRowColumn>
                    <TableRowColumn align="right">{row.participateGrade}</TableRowColumn>
                    <TableRowColumn align="right">{row.overallGrade}</TableRowColumn>
                  </TableRow>
              ))}

            </TableBody>
          </Table>

        </div>
      </MuiThemeProvider>
    )
  }
}

// meteor reactive data container
export const MaterialUITable = createContainer((props) => {
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
    //temp: props.temp
    courseId: props.courseId,
    courseName: course.name,
    students: students,
    grades: grades,
    tableData: tableData,
    sessions: sessions,
    loading: !handle.ready()
  }
}, _MaterialUITable)

_MaterialUITable.propTypes = {
  //temp: PropTypes.string
  courseId: PropTypes.string
}
