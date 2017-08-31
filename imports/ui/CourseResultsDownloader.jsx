// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'
import { CSVLink } from 'react-csv'

import { Stats } from '../stats'

import { Questions } from '../api/questions'
import { Sessions } from '../api/sessions'
import { Responses } from '../api/responses'

export class _CourseResultsDownloader extends Component {

  render () {
    const statsMap = _.object(_.map(this.props.sessions, (s) => {
      const q = _.where(this.props.questions, {sessionId: s._id})
      const r = _.filter(this.props.responses, (resp) => { return s.questions.indexOf(resp.questionId) !== -1 })
      return [s._id, new Stats(q, r)]
    }))

    let headers = ['Last name', 'First name', 'Email']

    this.props.sessions.forEach((s) => {
      headers.push(s.name + ' Participation')
      headers.push(s.name + ' Mark')
    })

    let data = this.props.students.map((student) => {
      let row = [student.profile.lastname, student.profile.firstname, student.emails[0].address]
      this.props.sessions.forEach((s) => {
        row.push(statsMap[s._id].sessionParticipation(student._id))
        row.push(statsMap[s._id].sessionGrade(student._id))
      })
      return row
    })

    const filename = this.props.course.name.replace(/ /g, '_') + '_results.csv'

    return (<CSVLink data={data} headers={headers} filename={filename}>
      <div type='button' className='btn btn-secondary'>
        Export as .csv
      </div>
    </CSVLink>)
  } //  end render

}

export const CourseResultsDownloader = createContainer((props) => {
  const handle = Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inCourse', props.course._id) &&
    Meteor.subscribe('responses.forCourse', props.course._id) &&
    Meteor.subscribe('users.myStudents', {cId: props.course._id})

  const studentIds = props.course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  const sessions = Sessions.find({ _id: { $in: props.course.sessions } }, { sort: { date: 1 } }).fetch()

  const questions = Questions.find({ courseId: props.course._id, sessionId: { $exists: true } }).fetch()

  const responses = Responses.find().fetch()

  return {
    sessions: sessions,
    responses: responses,
    students: students,
    questions: questions,
    loading: !handle.ready()
  }
}, _CourseResultsDownloader)

CourseResultsDownloader.propTypes = {
  course: PropTypes.object.isRequired
}
