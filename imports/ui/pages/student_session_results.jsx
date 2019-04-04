// QLICKER
// Author: Enoch T <me@enocht.am>
//
// student_session_results.jsx: page for students to review previous sessions

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'
import { Grades } from '../../api/grades'
import { Sessions } from '../../api/sessions'
import { Questions } from '../../api/questions'
import { Responses } from '../../api/responses'

import { QuestionWithResponseArray } from '../QuestionWithResponseArray'
import { StudentSessionResults } from '../StudentSessionResults'
import { _ } from 'underscore'
import { PracticeSessions } from '../../api/practiceSessions'
import { PracticeResponses } from '../../api/practiceResponses'

class _StudentSessionResultsPage extends Component {

  constructor (props) {
    super(props)

    this.state = { questionIndex: 0,
      showAllAtOnce: false
    }

    this.incrementQuestion = this.incrementQuestion.bind(this)
  }

  incrementQuestion (increment) {
    const newIndex = this.state.questionIndex + increment
    if (newIndex < this.props.questions.length && newIndex >= 0) {
      this.setState({ questionIndex: newIndex })
    }
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    if (this.props.questions.length < 1) return <div> No questions in session </div>

    const questionToView = _(this.props.questions).findWhere({_id: this.props.session.questions[this.state.questionIndex]})
    const incrementQuestion = () => this.incrementQuestion(1)
    const decrementQuestion = () => this.incrementQuestion(-1)
    const mark = this.props.isPracticeSession ? {} : _(this.props.grade.marks).findWhere({ questionId: questionToView._id })
    const feedback = this.props.isPracticeSession ? '' : mark.feedback
    const points = this.props.isPracticeSession ? '' : mark.points + '/' + mark.outOf + ' points'
    const pointsString = this.props.isPracticeSession ? '' : '(' + points + ')'

    return (
      <div className='container ql-results-page'>

        <div className='ql-card'>
          <div className='ql-header-bar'>
            <div className='ql-review-header-bar'>
              {this.props.session.name} (<span className='uppercase'>{this.props.course.fullCourseCode()}</span>)
              {!this.props.isPracticeSession && this.props.grade
                ? <div>
                    Grade: {this.props.grade.value.toFixed(0)}% Participation: {this.props.grade.participation.toFixed(0)}%
                  </div>
                : ''
              }
            </div>
          </div>
          <div className='ql-card-content'>
            <ul className='nav nav-tabs'>
              <li role='presentation' className={!this.state.showAllAtOnce ? 'active' : ''}>
                <a role='button' onClick={() => this.setState({showAllAtOnce: false})}>One question</a>
              </li>
              <li role='presentation' className={this.state.showAllAtOnce ? 'active' : ''}>
                <a role='button' onClick={() => this.setState({ showAllAtOnce: true })}>All questions</a>
              </li>
            </ul>
            {this.state.showAllAtOnce
              ? <StudentSessionResults
                session={this.props.session}
                isPracticeSession={this.props.isPracticeSession}
                studentId={this.props.userId} />
              : <div>
                <div className='ql-review-qControl-container'>
                  <div className='ql-review-qControl-title'>
                      Q{this.state.questionIndex + 1}/{this.props.questions.length} {pointsString}
                  </div>
                  { this.props.questions.length > 1
                    ? <div className='ql-review-qControl-controls'>
                      <div className='btn-group btn-group-justified'>
                        <div className='btn-group'>
                          <button className='btn btn-primary' onClick={decrementQuestion} disabled={this.state.questionIndex <= 0}>
                            <span className='glyphicon glyphicon-chevron-left' /> Previous question
                            </button>
                        </div>
                        <div className='btn-group'>
                          <button className='btn btn-primary' onClick={incrementQuestion} disabled={this.state.questionIndex >= this.props.questions.length - 1}>
                                Next question <span className='glyphicon glyphicon-chevron-right' />
                          </button>
                        </div>
                      </div>
                    </div>
                      : ''
                    }
                </div>
                <div className='ql-review-question'>
                  <QuestionWithResponseArray
                    question={questionToView}
                    responses={questionToView.studentResponses}
                    solutionScroll
                    isPracticeSession={this.props.isPracticeSession} />
                </div>

                {!this.props.isPracticeSession && feedback
                  ? <div className='ql-review-feedback'> Feedback: {feedback} </div>
                  : ''
                }
              </div>
            }
          </div>
        </div>
      </div>
    )
  }

}

// meteor reactive data container
export const StudentSessionResultsPage = createContainer((props) => {
  let handle, session
  let grade = {}
  let questions = []
  let isPracticeSession = false
  const userId = Meteor.userId()

  if (props.practiceSessionId) {
    handle = Meteor.subscribe('userData') &&
      Meteor.subscribe('courses') &&
      Meteor.subscribe('practiceSessions.forCourse', props.courseId) &&
      Meteor.subscribe('questions.public', props.courseId) &&
      Meteor.subscribe('questions.library', props.courseId) &&
      Meteor.subscribe('responses.forPracticeSession', props.practiceSessionId)

    session = PracticeSessions.findOne(props.practiceSessionId)
    questions = Questions.find({ _id: { $in: session.questions } }).fetch()
    questions.map((question) => {
      question.studentResponses = PracticeResponses.find({
        practiceSessionId: props.practiceSessionId,
        questionId: question._id
      }).fetch()
    })
    isPracticeSession = true
  } else {
    handle = Meteor.subscribe('userData') &&
      Meteor.subscribe('courses') &&
      Meteor.subscribe('sessions.single', props.sessionId) &&
      Meteor.subscribe('grades.forSession', props.sessionId) &&
      Meteor.subscribe('questions.forReview', props.sessionId) &&
      Meteor.subscribe('responses.forSession', props.sessionId)

    session = Sessions.findOne(props.sessionId)
    grade = Grades.findOne({sessionId: props.sessionId, userId: userId, visibleToStudents: true})
    questions = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

    questions.map((question) => {
      question.studentResponses = Responses.find({ studentUserId: userId, questionId: question._id }).fetch()
    })
  }

  const course = Courses.findOne(session.courseId)

  return {
    course: course,
    session: session,
    loading: !handle.ready(),
    grade: grade,
    userId: userId,
    questions: questions,
    isPracticeSession: isPracticeSession
  }
}, _StudentSessionResultsPage)

StudentSessionResultsPage.propTypes = {
  sessionId: PropTypes.string,
  studentId: PropTypes.string,
  courseId: PropTypes.string,
  practiceSessionId: PropTypes.string
}
