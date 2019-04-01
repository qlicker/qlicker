// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentSessionResults.jsx: Component for student-specific session review

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../api/questions'
import { Responses } from '../api/responses'
import { Grades } from '../api/grades'

import { StudentQuestionResultsClassList } from './StudentQuestionResultsClassList'
import { StudentQuestionResultsListItem } from './StudentQuestionResultsListItem'
import { PracticeResponses } from '../api/practiceResponses'

export class _StudentSessionResults extends Component {

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    return (<div>
      {
        this.props.session.questions.map((qId, index) => {
          const q = this.props.questions[qId]
          const mark = !this.props.isPracticeSession && (this.props.grade && this.props.grade.marks)
            ? _(this.props.grade.marks).findWhere({ questionId: qId })
            : null
          return (<div key={'qdiv_' + qId}>
            <a role='button' data-toggle='collapse' href={'#collapse_' + qId} aria-expanded='false' aria-controls={'collapse_' + qId} style={{ textDecoration: 'none' }}>
              <StudentQuestionResultsListItem question={q} session={this.props.session} index={index} isPracticeSession={this.props.isPracticeSession} />
            </a>
            <div className='collapse' id={'collapse_' + qId}>
              <div className='row'>
                <StudentQuestionResultsClassList question={q} mark={mark} practiceSessionId={this.props.isPracticeSession ? this.props.session._id : null} />
              </div>
            </div>
          </div>)
        })
      }
    </div>)
  } //  end render

}

export const StudentSessionResults = createContainer((props) => {
  let handle, questions
  let grade = null

  if (props.isPracticeSession) {
    handle = Meteor.subscribe('practiceSessions.forCourse', props.session.courseId) &&
      Meteor.subscribe('questions.public', props.session.courseId) &&
      Meteor.subscribe('questions.library', props.session.courseId) &&
      Meteor.subscribe('responses.forPracticeSession', props.session._id)

    questions = Questions.find({ _id: { $in: props.session.questions } }).fetch()
    questions.map((question) => {
      question.studentResponses = PracticeResponses.find({
        practiceSessionId: props.practiceSessionId
      }).fetch()
    })
  } else {
    handle = Meteor.subscribe('questions.forReview', props.session._id) &&
      Meteor.subscribe('responses.forSession', props.session._id) &&
      Meteor.subscribe('grades.forSession', props.session._id)

    questions = Questions.find({_id: {$in: props.session.questions || []}}).fetch()
    grade = Grades.findOne({sessionId: props.session._id, userId: Meteor.userId(), visibleToStudents: true})

    questions.map((questions) => {
      questions.studentResponses = Responses.find({studentUserId: props.studentId, questionId: questions._id}).fetch()
    })
  }

  return {
    questions: _(questions).indexBy('_id'),
    grade: grade,
    loading: !handle.ready()
  }
}, _StudentSessionResults)

StudentSessionResults.propTypes = {
  session: PropTypes.object.isRequired,
  isPracticeSession: PropTypes.bool
}
