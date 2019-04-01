/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>, Jacob Huschilt
//
// course.jsx: student page for course details

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Courses } from '../../../api/courses'
import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'
import { SessionListItem } from '../../SessionListItem'
import { CreatePracticeQuizModal } from '../../modals/CreatePracticeQuizModal'

class _Course extends Component {

  constructor (props) {
    super(props)

    this.state = {
      expandedSessionList: false,
      showingCreatePracticeQuizModal: false
    }
    this.sessionClickHandler = this.sessionClickHandler.bind(this)
    this.addSubmittedQuiz = this.addSubmittedQuiz.bind(this)
    this.toggleCreatePracticeQuizModal = this.toggleCreatePracticeQuizModal.bind(this)
  }

  toggleCreatePracticeQuizModal () {
    this.setState({
      showingCreatePracticeQuizModal: !this.state.showingCreatePracticeQuizModal
    })
  }
  componentDidMount () {
    if (this.props.sessions) {
      this.props.sessions.forEach(s => {
        if (s.quizIsActive()) {
          Meteor.call('sessions.quizSubmitted', s._id, (err, submitted) => {
            if (err) alertify.error(err.error)
            if (!err && submitted) {
              this.addSubmittedQuiz(s._id)
            }
          })
        }
      })
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.sessions) {
      nextProps.sessions.forEach(s => {
        if (s.quizIsActive()) {
          Meteor.call('sessions.quizSubmitted', s._id, (err, submitted) => {
            if (err) alertify.error(err.error)
            if (!err && submitted) {
              this.addSubmittedQuiz(s._id)
            }
          })
        }
      })
    }
  }

  addSubmittedQuiz (id) {
    let submitted = this.state.submitted ? this.state.submitted : []
    if (!_(submitted).contains(id))submitted.push(id)
    this.setState({submitted: submitted})
  }

  sessionClickHandler (session) {
    // Disabled the student.results route for now:
    if (session.status === 'done' && session.reviewable) {
      Router.go('session.results', { sessionId: session._id, courseId: this.props.course._id })
    } else if (session.status === 'done') {
      if (session.quiz) alertify.error('Quiz not reviewable')
      else alertify.error('Session not reviewable')
    } else if (session.quiz && !session.quizIsActive()) {
      alertify.error('Quiz not open')
    } else if (session.quiz && this.state.submitted && _(this.state.submitted).contains(session._id)/* session.quizCompleted(Meteor.userId()) */) {
      alertify.error('Quiz already submitted')
    } else {
      Router.go('session', { _id: session._id, courseId: this.props.course._id })
    }
  }

  renderSessionList () {
    let sessions = this.props.sessions || []
    const statusSort = {hidden: 2, visible: 3, running: 1, done: 4}
    sessions = _(sessions).chain().sortBy(function (ses) {
      return ses.date
    }).reverse().sortBy(function (ses) {
      return ses.quizIsActive() ? 1 : statusSort[ses.status]
    }).value()

    const maxNum = 8
    const totalSessions = sessions.length
    if (!this.state.expandedSessionList) sessions = sessions.slice(0, maxNum)
    const toggleExpandedSessionList = () => { this.setState({ expandedSessionList: !this.state.expandedSessionList }) }
    const expandText = !this.state.expandedSessionList ? 'Show all' : 'Show less'
    return (<div>
      {
        sessions.map((s) => (<SessionListItem
          key={s._id}
          session={s}
          submittedQuiz={s.quiz && this.state.submitted && _(this.state.submitted).contains(s._id) ? true : undefined}
          click={() => this.sessionClickHandler(s)} />))
      }
      { totalSessions > maxNum
        ? <a href='#' className='show-more-item' onClick={toggleExpandedSessionList}>
          <div className='ql-list-item'>{expandText}</div>
        </a> : '' }
    </div>)
  }

  render () {
    const toggleCreatePracticeQuizModal = () => { this.setState({ showingCreatePracticeQuizModal: !this.state.showingCreatePracticeQuizModal }) }

    const callQuestions = (numberOfQuestions, tags) => {
      toggleCreatePracticeQuizModal()
      Meteor.call('questions.getRandom.forTags', this.props.courseId, numberOfQuestions, tags, (error, questions) => {
        if (error) {
          alertify.error('Unable to generate quiz')
        } else {
          const practiceSession = {
            name: 'Practice Session: ' + this.props.course.name,
            courseId: this.props.courseId,
            studentId: Meteor.userId(),
            status: 'running',
            questions: questions,
            tags: tags
          }

          Meteor.call('practiceSessions.create', practiceSession, (error, practiceSessionId) => {
            if (error) {
              alertify.error('Unable to generate quiz')
            } else {
              Router.go('practice.session', {
                courseId: this.props.courseId,
                practiceSessionId: practiceSessionId
              })
            }
          })
        }
      })
    }
    return (
      <div className='container ql-manage-course'>
        <h2>
          {this.props.course.name} [<span className='uppercase'>{this.props.course.fullCourseCode()}</span>]
        </h2>

        <div className='session-button-group'>
          <button className='btn btn-primary' onClick={toggleCreatePracticeQuizModal}>
            Create Practice Quiz
            {this.state.showingCreatePracticeQuizModal ? <CreatePracticeQuizModal courseId={this.props.course._id} courseName={this.props.course.courseCode()} done={callQuestions} /> : '' }
          </button>
        </div>

        {this.renderSessionList()}

        <br />
      </div>
    )
  }

}

export const Course = createContainer((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('userData') &&
    Meteor.subscribe('sessions.forCourse', props.courseId) &&
    Meteor.subscribe('questions.library', props.courseId) &&
    Meteor.subscribe('questions.public', props.courseId) &&
    Meteor.subscribe('practiceSessions.forCourse')

  const student = Meteor.users.findOne({_id: Meteor.userId()})
  const course = Courses.findOne({_id: props.courseId})
  const sessions = Sessions.find({courseId: props.courseId}).fetch()
  const questions = Questions.find({courseId: props.courseId}).fetch()

  return {
    course: course,
    student: student,
    sessions: sessions,
    questions: questions,
    loading: !handle.ready()
  }
}, _Course)
