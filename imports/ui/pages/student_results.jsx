// QLICKER
// Author: Enoch T <me@enocht.am>
//
// student_results.jsx: page for displaying specific student participation by course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'
import $ from 'jquery'
import dl from 'datalib'
import { Table, Column, Cell } from 'fixed-data-table'

import { Courses } from '../../api/courses'
import { Sessions } from '../../api/sessions'
import { Responses } from '../../api/responses'
import { Questions } from '../../api/questions'

import { Participation } from '../../stats'

class _StudentResultsPage extends Component {

  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const participation = new Participation(this.props.sessionMap, this.props.questions, this.props.responses)
    const sessionList = _(this.props.sessionList).pluck('_id')

    const sessionNameList = sessionList.map(sId => this.props.sessionMap[sId].name)
    const percentageList = sessionList.map(sId => (participation.percentage(sId, this.props.student._id) * 100).toFixed(0))

    return (
      <div className='container ql-results-page'>

        <div className='ql-card'>
          <div className='ql-header-bar'>
            <h4>{this.props.student.getName()} (<span className='uppercase'>{this.props.course.fullCourseCode()}</span>)</h4>
          </div>
          <div className='ql-card-content'>

            <Table
              rowHeight={40}
              rowsCount={sessionList.length}
              width={window.innerWidth - (window.innerWidth * 0.20)}
              height={window.innerHeight - (window.innerHeight * 0.30)}
              headerHeight={50}>
              <Column
                header={<Cell>First, Last</Cell>}
                cell={({rowIndex}) => <Cell>{sessionNameList[rowIndex]}</Cell>}
                fixed
                width={250}
              />
              <Column
                header={<Cell>Percentage Answered</Cell>}
                cell={({rowIndex}) => <Cell>{percentageList[rowIndex]}%</Cell>}
                width={100}
              />

            </Table>

          </div>
        </div>
      </div>
    )
  }

}

// meteor reactive data container
export const StudentResultsPage = createContainer((props) => {
  const handle = Meteor.subscribe('userData') &&
    Meteor.subscribe('courses') &&
    Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inCourse', props.courseId) &&
    Meteor.subscribe('responses.forCourse', props.courseId)

  const student = Meteor.users.findOne(props.studentId)
  const course = Courses.findOne(props.courseId)

  const sessionQuery = { courseId: course._id }
  if (Meteor.user().hasRole('student')) sessionQuery.status = { $ne: 'hidden' }
  const sessions = Sessions.find(sessionQuery, { sort: { date: 1 } }).fetch()

  const questionIds = _.flatten(_(sessions).pluck('questions'))
  const responses = Responses.find({ studentUserId: student._id, questionId: { $in: questionIds } }).fetch()
  const questions = Questions.find({ _id: { $in: questionIds } }).fetch()

  return {
    course: course,
    student: student,
    questions: questions,
    responses: responses,
    sessionList: sessions,
    sessionMap: _(sessions).indexBy('_id'),
    loading: !handle.ready()
  }
}, _StudentResultsPage)

