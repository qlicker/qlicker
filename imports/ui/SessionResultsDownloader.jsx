// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'
import { CSVDownload } from 'react-csv'

import { Questions } from '../api/questions'
import { Courses } from '../api/courses'
import { Responses } from '../api/responses'

export class _SessionResultsDownloader extends Component {

  render () {
    const headers = ['Name', 'Participation mark', '% answered']
    const asked = _.uniq(_.pluck(this.props.responses, 'questionId'))

    let data = this.props.students.map((student) => {
      const studentResponses = _.filter(this.props.responses, resp => { return resp.studentUserId === student._id })
      const uniqueResponses = _.uniq(studentResponses, 'questionId')
      const mark = (uniqueResponses.length / asked.length) * 100
      const participation = mark >= 50 ? 100 : 0
      const row = [student.getName(), participation, mark]
      return row
    })
    return (<CSVDownload data={data} headers={headers} />)
  } //  end render

}

export const SessionResultsDownloader = createContainer((props) => {
  const handle = Meteor.subscribe('questions.inSession', props.session._id) &&
    Meteor.subscribe('responses.forSession', props.session._id) &&
    Meteor.subscribe('users.myStudents') &&
    Meteor.subscribe('courses')

  const course = Courses.find({ _id: props.session.courseId }).fetch()[0]

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  const questions = Questions.find({ sessionId: props.session._id, sessionOptions: { $exists: true } }).fetch()

  const responses = Responses.find().fetch()

  return {
    responses: responses,
    students: students,
    questions: questions,
    loading: !handle.ready()
  }
}, _SessionResultsDownloader)

SessionResultsDownloader.propTypes = {
  session: PropTypes.object.isRequired
}

