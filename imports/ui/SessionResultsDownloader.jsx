// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'
import { CSVLink } from 'react-csv'

import { Questions } from '../api/questions'
import { Courses } from '../api/courses'
import { Responses } from '../api/responses'
import { Stats } from '../stats'

import { QUESTION_TYPE } from '../configs'

export class _SessionResultsDownloader extends Component {

  render () {
    const headers = ['Last name', 'First name', 'Email', 'Participation', 'Mark']
    const stats = new Stats(this.props.questions, this.props.responses)
    const questionMap = _.indexBy(this.props.questions, '_id')

    this.props.session.questions.forEach((qId, ind) => {
      headers.push((ind + 1) + '. ' + questionMap[qId].plainText)
    })

    let data = this.props.students.map((student) => {
      const row = [
        student.profile.lastname,
        student.profile.firstname,
        student.emails[0].address,
        stats.sessionParticipation(student._id),
        stats.sessionGrade(student._id)
      ]
      this.props.session.questions.forEach((qId) => {
        const cell = questionMap[qId].type === QUESTION_TYPE.SA ? 'N/A' : stats.questionGrade(qId, student._id)
        row.push(cell)
      })
      return row
    })
    const filename = this.props.session.name.replace(/ /g, '_') + '_results.csv'
    return (<CSVLink data={data} headers={headers} filename={filename}>
      <span className='btn pull-right'>Export as .csv</span>
    </CSVLink>)
  } //  end render

}

export const SessionResultsDownloader = createContainer((props) => {
  const handle = Meteor.subscribe('courses', {isInstructor: Meteor.user().isInstructor(props.session.courseId)}) &&
    Meteor.subscribe('questions.inSession', props.session._id) &&
    Meteor.subscribe('responses.forSession', props.session._id) &&
    Meteor.subscribe('users.myStudents', {cId: props.session.courseId})

  const course = Courses.find({ _id: props.session.courseId }).fetch()[0]

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  const questions = Questions.find({ sessionId: props.session._id }).fetch()

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

