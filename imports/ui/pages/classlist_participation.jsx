// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { Table, Column, Cell } from 'fixed-data-table'

import { _ } from 'underscore'
import $ from 'jquery'
import dl from 'datalib'

import { Courses } from '../../api/courses'
import { Sessions } from '../../api/sessions'
import { Responses } from '../../api/responses'
import { Questions } from '../../api/questions'

import { Participation } from '../../stats'

class _ClasslistParticipation extends Component {

  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const sessionList = _(this.props.sessionList).pluck('_id')

    const participation = new Participation(this.props.sessionMap, this.props.questions, this.props.responses)

    const getTextWidth = (text) => {
      let element = document.createElement('canvas')
      let context = element.getContext('2d')
      const width = (context.measureText(text).width + 30)
      return width > 300 ? 300 : width
    }

    const NameCell = ({rowIndex}) => <Cell>{ this.props.students[rowIndex].getName() }</Cell>
    const PercentageCell = ({rowIndex, sId}) => {
      const session = this.props.sessionMap[sId]
      const student = this.props.students[rowIndex]
      const joined = session.joined || []
      return <Cell>
        { joined.indexOf(student._id) > -1 ? '✓' : '✗' }&nbsp;
        { (participation.percentage(sId, student._id) * 100).toFixed(0) }%
      </Cell>
    }

    return (

      <div className='container ql-results-page'>

        <div className='ql-card'>

          <div className='ql-header-bar'>
            <h4><span className='uppercase'>{this.props.course.fullCourseCode()}</span>: Class Participation List</h4>
          </div>

          <div className='ql-card-content'>
            <Table
              rowHeight={35}
              rowsCount={this.props.students.length}
              width={window.innerWidth - (window.innerWidth * 0.20)}
              height={window.innerHeight - (window.innerHeight * 0.30)}
              headerHeight={50}>
              <Column
                header={<Cell>First, Last</Cell>}
                cell={<NameCell />}
                fixed
                width={170}
              />
              { sessionList.map((sId) =>
                <Column
                  key={sId}
                  header={<Cell onClick={_ => Router.go('session.results', { sessionId: sId })}><a href='#'>{this.props.sessionMap[sId].name}</a></Cell>}
                  cell={<PercentageCell sId={sId} />}
                  width={getTextWidth(this.props.sessionMap[sId].name)}
                />
              ) }

            </Table>
          </div>

        </div>
      </div>

    )
  }

}

// meteor reactive data container
export const ClasslistParticipationPage = createContainer((props) => {
  const handle = Meteor.subscribe('users.myStudents', {cId: props.courseId}) &&
    Meteor.subscribe('courses', {isInstructor: Meteor.user().isInstructor(props.courseId)}) &&
    Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inCourse', props.courseId) &&
    Meteor.subscribe('responses.forCourse', props.courseId)

  const user = Meteor.user()

  const course = Courses.findOne(props.courseId)

  let questionsInSession, students, sessions, responses
  if (course) {
    students = Meteor.users.find({ _id: { $in: course.students || [] } }, { sort: { 'profile.lastname': 1 } }).fetch()

    const sessionQuery = { courseId: course._id }
    if (user.hasRole('student')) sessionQuery.status = { $ne: 'hidden' }
    sessions = Sessions.find(sessionQuery, { sort: { date: 1 } }).fetch()

    const questionIds = _.flatten(_(sessions).pluck('questions'))

    responses = Responses.find({ questionId: { $in: questionIds } }).fetch()

    questionsInSession = Questions.find({ _id: { $in: questionIds } }).fetch()
  }

  return {
    questions: questionsInSession,
    students: students,
    course: course,
    sessionList: sessions,
    sessionMap: _(sessions).indexBy('_id'),
    responses: responses,
    loading: !handle.ready()
  }
}, _ClasslistParticipation)

