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

class _ClasslistParticipation extends Component {

  constructor (props) {
    super(props)

    this.state = {}
    this.calculatePercentage = this.calculatePercentage.bind(this)
  }

  calculatePercentage (sId, studentUserId) {
    const session = this.props.sessions[sId]
    if ((session.joined || []).indexOf(studentUserId) === -1) return 0

    let max = 0 // questions * attempts for that question
    ;(session.questions || []).forEach(qId => {
      const q = this.props.questions[qId]
      max += q && q.sessionOptions ? q.sessionOptions.attempts.length : 0
    })

    let answered = 0 // number that this student has answered

    const res = this.props.responses[studentUserId]
    if (!res || !res.questions) return 0

    res.questions.forEach(q => {
      answered += q.values.length
    })
    return max > 0 ? answered / max : 0
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const sessionList = this.props.course.sessions || []

    const getTextWidth = (text) => {
      let element = document.createElement('canvas')
      let context = element.getContext('2d')
      return context.measureText(text).width + 30
    }

    const NameCell = ({rowIndex}) => <Cell>{ this.props.students[rowIndex].getName() }</Cell>
    const PercentageCell = ({rowIndex, sId}) => (
      <Cell>
        { (this.calculatePercentage(sId, this.props.students[rowIndex]._id) * 100).toFixed(0) }%
      </Cell>
    )

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
              width={window.innerWidth - 110}
              height={window.innerHeight - 250}
              headerHeight={50}>
              <Column
                header={<Cell>First, Last</Cell>}
                cell={<NameCell />}
                fixed
                width={170}
              />
              { sessionList.map((sId) =>
                <Column
                  header={<Cell onClick={_ => Router.go('session.results', { sessionId: sId })}><a href='#'>{this.props.sessions[sId].name}</a></Cell>}
                  cell={<PercentageCell sId={sId} />}
                  width={getTextWidth(this.props.sessions[sId].name)}
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
  const handle = Meteor.subscribe('users.myStudents') &&
    Meteor.subscribe('courses') &&
    Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inCourse', props.courseId) &&
    Meteor.subscribe('responses.forCourse', props.courseId)

  const user = Meteor.user()

  const course = Courses.findOne(props.courseId)

  let questionsInSession, students, sessions, responses, groupedResponses
  if (course) {
    students = Meteor.users.find({ _id: { $in: course.students } }, { sort: { 'profile.lastname': 1 } }).fetch()

    const sessionQuery = { courseId: course._id }
    if (user.hasRole('student')) sessionQuery.status = { $ne: 'hidden' }
    sessions = Sessions.find(sessionQuery).fetch()

    const questionIds = _.flatten(_(sessions).pluck('questions'))
    responses = Responses.find({ questionId: { $in: questionIds } }).fetch()

    groupedResponses = dl.groupby('studentUserId').execute(responses)

    groupedResponses.forEach(r => {
      r.questions = dl.groupby('questionId').execute(r.values)
    })

    questionsInSession = Questions.find({ _id: { $in: questionIds } }).fetch()
  }

  return {
    questions: _.indexBy(questionsInSession, '_id'), // question map
    students: students,
    course: course,
    sessions: _(sessions).indexBy('_id'),
    responses: _(groupedResponses).indexBy('studentUserId'),
    loading: !handle.ready()
  }
}, _ClasslistParticipation)

