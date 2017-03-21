// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
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

    console.log(this.props.students, this.props.responses)
    return (
      <div className='container ql-results-page'>
        <h2>Class list participation</h2>
        <a className='btn btn-default' href={Router.routes['course.results.sessions'].path({ _id: this.props.course._id })}>Participation by Session</a>
        <br />
        <h3>Percentanges represent questions answered (not correctness)</h3>
        <table className='table table-bordered'>
          <tr>
            <th>Last, First</th>
            { sessionList.map((sId) => <th>{this.props.sessions[sId].name}</th>) }
          </tr>
          <tbody>
            {
              this.props.students.map((s) => {
                return (
                  <tr>
                    <td>{s.getName()}</td>
                    { sessionList.map((sId) => <td>{ (this.calculatePercentage(sId, s._id) * 100).toFixed(0) }%</td>) }
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    )
  }

}

// meteor reactive data container
export const ClasslistParticipationPage = createContainer((props) => {
  const handle = Meteor.subscribe('userData') &&
    Meteor.subscribe('courses') &&
    Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inCourse', props.courseId) &&
    Meteor.subscribe('responses.forCourse', props.courseId)

  const user = Meteor.user()

  const course = Courses.findOne(props.courseId)

  const students = Meteor.users.find({ _id: { $in: course.students } }, { sort: { 'profile.lastname': 1 } }).fetch()

  const sessionQuery = { courseId: course._id }
  if (user.hasRole('student')) sessionQuery.status = { $ne: 'hidden' }
  const sessions = Sessions.find(sessionQuery).fetch()

  const questionIds = _.flatten(_(sessions).pluck('questions'))
  const responses = Responses.find({ questionId: { $in: questionIds } }).fetch()

  const groupedResponses = dl.groupby('studentUserId').execute(responses)

  groupedResponses.forEach(r => {
    r.questions = dl.groupby('questionId').execute(r.values)
  })

  const questionsInSession = Questions.find({ _id: { $in: questionIds } }).fetch()

  return {
    questions: _.indexBy(questionsInSession, '_id'), // question map
    students: students,
    course: course,
    sessions: _(sessions).indexBy('_id'),
    responses: _(groupedResponses).indexBy('studentUserId'),
    loading: !handle.ready()
  }
}, _ClasslistParticipation)

