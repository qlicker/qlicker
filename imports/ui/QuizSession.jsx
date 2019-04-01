import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../api/questions'
import { Sessions } from '../api/sessions'
import { Responses } from '../api/responses'
import { PracticeResponses } from '../api/practiceResponses'
import { Courses } from '../api/courses'

import { QuestionDisplay } from './QuestionDisplay'
import { QUESTION_TYPE } from '../configs'
import { PracticeSessions } from '../api/practiceSessions'

export class _QuizSession extends Component {

  constructor (props) {
    super(props)

    this.state = {
      questionsToTryAgain: [],
      submitted: false
    }

    this.scrollTo = this.scrollTo.bind(this)
    this.submitQuiz = this.submitQuiz.bind(this)
    // this.savePracticeQuestionResponse = this.savePracticeQuestionResponse.bind(this)
    this.checkForSubmissionAndEmptyQuestions = this.checkForSubmissionAndEmptyQuestions.bind(this)

    if (!props.isPracticeSession && Meteor.user().isStudent(this.props.session.courseId)) {
      Meteor.call('sessions.join', this.props.session._id, Meteor.userId())
    }
  }

  componentDidMount () {
    if (!this.props.isPracticeSession) {
      this.setState({loading: false})
      this.checkForSubmissionAndEmptyQuestions(
        this.props.session,
        this.props.questions,
        this.props.myResponses
      )
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!nextProps.isPracticeSession) {
      this.checkForSubmissionAndEmptyQuestions(
        nextProps.session,
        nextProps.questions,
        nextProps.myResponses
      )
    }
  }

  checkForSubmissionAndEmptyQuestions (session, questions, myResponses) {
    let isSubmitted = false
    let emptySA = false
    // Look for any SA response that is empty, so that user can be warned upon submission
    if (session) {
      session.questions.forEach(qId => {
        let q = questions[qId]
        if (q && q.type === QUESTION_TYPE.SA) {
          let response = _(myResponses).findWhere({ questionId: qId })
          if (response && response.answer == false && response.answerWysiwyg == false) { // double equal matters
            emptySA = true
          }
        }
      })
      if (session.quizIsActive()) {
        Meteor.call('sessions.quizSubmitted', session._id, (err, submitted) => {
          if (err) alertify.error(err.error)
          if (!err && submitted) {
            isSubmitted = true
          }
          this.setState({submitted: isSubmitted})
        })
      }
    }
    this.setState({emptySA: emptySA})
  }

  scrollTo (qId) {
    const node = ReactDOM.findDOMNode(this.refs['qdisp' + qId])
    if (node) window.scrollTo({ top: node.offsetTop, behavior: 'smooth' })
  }

  // TODO: Fix this
  submitQuiz () {
    if (this.state.emptySA) {
      if (!confirm('You have empty short answers, submit anyway?')) return
    }
    // Call a method to unset the editable part of the responses.
    if (confirm('Are you sure? You can no longer update answers after submitting.')) {
      if (this.props.isPracticeSession) {
        Meteor.call('practiceSessions.submitQuiz', this.props.session._id, (err) => {
          if (err) return alertify.error('Error: ' + err.message)
          alertify.success('Quiz submitted')
          Router.go('practice.session.results', {courseId: this.props.courseId, practiceSessionId: this.props.practiceSessionId})
        })
      } else {
        Meteor.call('sessions.submitQuiz', this.props.session._id, (err) => {
          if (err) return alertify.error('Error: ' + err.message)
          alertify.success('Quiz submitted')
          Router.go('course', { courseId: this.props.session.courseId })
        })
      }
    }
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const cId = this.props.session.courseId
    const user = Meteor.user()
    if (!user.isStudent(cId) && !user.isInstructor(cId)) {
      Router.go('login')
    }
    if (!this.props.isPracticeSession && (this.state.submitted || !this.props.session.quizIsActive())) {
      Router.go('/course/' + this.props.session.courseId)
    }

    const session = this.props.session
    const qList = session.questions
    if (qList.length < 1) return <div className='ql-subs-loading'>No questions in session</div>
    let qCount = 0
    let qCount2 = 0

    const canSubmit = this.props.myResponses && this.props.myResponses.length === qList.length && !this.state.submitted

    return (
      <div className='container ql-quiz-session'>
        <div className='row'>
          <div className='col-md-2 hidden-sm hidden-xs'>
            <div className='ql-quiz-session-qnav'>
              <div className='ql-quiz-session-qnav-title'>Questions</div>
              <div className='ql-quiz-session-qnav-qlist'>
                {
                  qList.map((qid) => {
                    qCount += 1
                    let className = 'ql-quiz-session-questionPad'
                    const click = () => this.scrollTo(qid)
                      // const responses = _.where(this.props.myResponses, { questionId: qid })
                      // let response =  responses.length > 0 ? _.max(responses, (resp) => { return resp.attempt }) : undefined

                    let response = _(this.props.myResponses).findWhere({questionId: qid})
                    if (!response) response = undefined

                    if (response) className += ' green'
                    else className += ' red'

                    return (
                      <div className={className} key={qCount} onClick={click}> {qCount}</div>
                    )
                  })
                }
              </div>
              {canSubmit
                ? <div className='ql-quiz-submit-button'>
                  <div className='btn-group btn-group-justified'>
                    <div className='btn btn-primary' onClick={this.submitQuiz}>
                      Submit!
                    </div>
                  </div>
                </div>
                : ''
              }
            </div>
          </div>
          <div className='col-md-10'>
            <div className='ql-quiz-session-questions'>
              <div className='ql-quiz-session-questions-title'> {session.name ? session.name : ''} </div>
              {
                qList.map((qid) => {
                  qCount2 += 1
                  const q = this.props.questions[qid]

                  if (!q || (!this.props.isPracticeSession && !q.sessionOptions)) return <div className='ql-subs-loading'>Loading</div>
                  const points = this.props.isPracticeSession
                    ? ''
                    : q.sessionOptions.points ? q.sessionOptions.points : 0
                  const pointsString = this.props.isPracticeSession ? '' : '(' + points + ' points)'
                    // const responses = _.where(this.props.myResponses, { questionId: qid })
                    // let response =  responses.length >0 ? _.max(responses, (resp) => { return resp.attempt }) : undefined
                  let response = _(this.props.myResponses).findWhere({ questionId: qid })
                  let readOnly
                  if (!response) response = undefined
                  else {
                    if (!response.editable) readOnly = true
                  }
                  const questionDisplay = user.isInstructor(session.courseId)
                      ? <QuestionDisplay question={q} readOnly /> // Practice sessions only visible to students; no need to check here
                      : <QuestionDisplay
                        question={q}
                        isQuiz
                        response={response}
                        readOnly={readOnly}
                        attemptNumber={1}
                        practiceSessionId={this.props.practiceSessionId} />

                  return (
                    <div className='ql-quiz-session-question' ref={'qdisp' + qid} key={'qdisp' + qid} >
                      <div className='ql-quiz-session-question-title'>
                        Question {qCount2} of {qList.length} {pointsString}
                      </div>
                      { q ? questionDisplay : '' }
                    </div>
                  )
                })
              }
              {canSubmit
                ? <div className='ql-quiz-submit-button'>
                  <div className='btn-group btn-group-justified'>
                    <div className='btn btn-primary' onClick={this.submitQuiz}>
                      Submit!
                    </div>
                  </div>
                </div>
                : ''
              }
            </div>
          </div>
        </div>

      </div>
    )
  }

}

export const QuizSession = createContainer((props) => {
  let handle, courseName, session
  let questions = []
  let allMyResponses = []
  let isPracticeSession = false

  if (props.practiceSessionId) {
    handle = Meteor.subscribe('questions.public', props.courseId) &&
      Meteor.subscribe('questions.library', props.courseId) &&
      Meteor.subscribe('courses.single', props.courseId) &&
      Meteor.subscribe('responses.forPracticeSession', props.practiceSessionId) &&
      Meteor.subscribe('practiceSession.single', props.practiceSessionId)

    const course = Courses.findOne({_id: props.courseId})
    session = PracticeSessions.findOne({_id: props.practiceSessionId})
    questions = Questions.find({courseId: props.courseId}).fetch()

    allMyResponses = session ? PracticeResponses.find({questionId: {$in: session.questions}, studentUserId: Meteor.userId(), practiceSessionId: props.practiceSessionId}).fetch() : []
    courseName = course ? course.name : ''
    isPracticeSession = true
  } else {
    handle = Meteor.subscribe('sessions.single', props.sessionId) &&
      Meteor.subscribe('questions.inSession', props.sessionId) &&
      Meteor.subscribe('responses.forQuiz', props.sessionId) &&
      Meteor.subscribe('courses.single', props.courseId)

    const course = Courses.findOne({_id: props.courseId})
    courseName = course ? course.name : ''
    session = Sessions.findOne({ _id: props.sessionId })
    questions = session ? Questions.find({_id: { $in: session.questions }}).fetch() : []

    // The user's responses
    allMyResponses = session ? Responses.find({ questionId: { $in: session.questions },
      studentUserId: Meteor.userId(),
      attempt: 1 }).fetch() : []
  }

  return {
    courseName: courseName,
    questions: _.indexBy(questions, '_id'), // question map
    session: session, // session or practiceSession object
    myResponses: allMyResponses, // responses related to this session
    isPracticeSession: isPracticeSession,
    loading: !handle.ready()
  }
}, _QuizSession)

QuizSession.propTypes = {
  courseId: PropTypes.string,
  sessionId: PropTypes.string,
  practiceSessionId: PropTypes.string
}
