/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// session.jsx: page for display a running session to student

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../../../api/questions'
import { Sessions } from '../../../api/sessions'
import { Responses, responseDistribution } from '../../../api/responses'
import { QuizSession } from '../../QuizSession'

import { QuestionDisplay } from '../../QuestionDisplay'
import { ShortAnswerList } from '../../ShortAnswerList'
import { HistogramNumerical } from '../../HistogramNumerical'
import { QUESTION_TYPE } from '../../../configs'

class _Session extends Component {

  constructor (props) {
    super(props)

    this.state = {questionsToTryAgain: []}
    this.toggleTryAgain = this.toggleTryAgain.bind(this)
    // TODO: not sure this is the right point to join...
    if (Meteor.user().isStudent(this.props.session.courseId)) Meteor.call('sessions.join', this.props.session._id, Meteor.userId())
  }
  componentDidMount () {
    if (this.props.session){
      if (this.props.session.quizIsActive(Meteor.user())){
        Meteor.call('sessions.quizSubmitted', this.props.session._id, (err, submitted) =>{
          if(err) alertify.error(err.error)
          if(!err && submitted) {
            this.setState({submitted:true})
          }
        })
      }
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.session){
      if (nextProps.session.quizIsActive(Meteor.user())) {
        Meteor.call('sessions.quizSubmitted', nextProps.session._id, (err, submitted) =>{
          if(err) alertify.error(err.error)
          if(!err && submitted) {
            this.setState({submitted:true})
          }
        })
      }
    }
  }

  toggleTryAgain (qId) {
    let questionsToTryAgain = this.state.questionsToTryAgain
    questionsToTryAgain[qId] = !(questionsToTryAgain[qId])
    this.setState({ questionToTryAgain: questionsToTryAgain })
  }

  render () {
    if (this.props.loading || !this.props.session) return <div className='ql-subs-loading'>Loading</div>

    const cId = this.props.session.courseId
    const user = Meteor.user()
    if (!user.isStudent(cId) && !user.isInstructor(cId)) {
      Router.go('login')
    }
    if (this.state.submitted){
      //alertify.error('Quiz already completed')
      Router.go('/course/' + this.props.session.courseId)
    }

    const status = this.props.session.status
    if (status !== 'running' && !this.props.session.quizIsActive(user)) {
      let statusMessage

      if (status === 'visible') statusMessage = 'This session has not started yet. You can keep this page open until your professor starts the session or check back soon.'
      if (status === 'done') {
        statusMessage = 'This session has finished'
        if (user && !user.isInstructor(cId)) {
          // if it's an instructor, this is being shown as a second display, so dont't
          // go to the course page which would show everyone the class list
          Router.go('/course/' + this.props.session.courseId)
        }
      }
      return <div className='ql-subs-loading'>{statusMessage}</div>
    }
    const session = this.props.session

    if (!session.quiz) {
      // For questions asked in-class
      const current = this.props.session.currentQuestion
      const q = this.props.questions[current]
      if (!q || !q.sessionOptions) return <div className='ql-subs-loading'>Loading</div>

      const responses = _.where(this.props.myResponses, { questionId: q._id })
      let lastResponse = _.max(responses, (resp) => { return resp.attempt })
      if (_.isEmpty(lastResponse)) lastResponse = null

      // Determine the current attempt and whether the user has responded to that attempt
      // The current attempt is based on the sessionOptions of the question, and is always
      // the total number of attempts
      const currentAttemptNumber = q.sessionOptions.attempts.length
      const myLastAttemptNumber = lastResponse && lastResponse.attempt > 0 ? lastResponse.attempt : 0
      const response = myLastAttemptNumber < currentAttemptNumber ? null : lastResponse

      const responseStats = q.sessionOptions.stats ? this.props.responseStatsByQuestion[q._id] : null
      const questionDisplay = user.isInstructor(session.courseId)
        ? <QuestionDisplay question={q} readonly responseStats={responseStats} attemptNumber={currentAttemptNumber} />
        : <QuestionDisplay question={q} style={{float: 'right'}} attemptNumber={currentAttemptNumber}
          response={response} responseStats={responseStats} />
      return (
        <div className='container'>
          <div className='ql-session-display'>
            { questionDisplay }
          </div>
          { q.sessionOptions.stats && q.type === QUESTION_TYPE.SA
            ? <ShortAnswerList question={q} />
            : ''
          }
          { q.sessionOptions.stats && q.type === QUESTION_TYPE.NU
            ? <div className='ql-session-display-histogram'>
                 <HistogramNumerical question={q} width={300} />
              </div>
            : ''
          }
        </div>)
    } else {

      return (<QuizSession sessionId={this.props.sessionId} /> )
      /*
      // for questions in a quiz (all questions at once, possible multiple attempts allowed)
      const qlist = session.questions
      let qCount = 0
      const qLength = qlist.length
      let nResponses = 0
      return (
        <div className='container ql-session-display'>
          <div className='ql-session-question-list'>
            {
              qlist.map((qId) => {
                qCount += 1
                const q = this.props.questions[qId]
                if (!q || !q.sessionOptions) return <div className='ql-subs-loading'>Loading</div>
                // Get all the responses for this question, and the last one:
                const responses = _.where(this.props.myResponses, { questionId: qId })
                let lastResponse = _.max(responses, (resp) => { return resp.attempt })
                const maxAttempts = q.sessionOptions.maxAttempts ? q.sessionOptions.maxAttempts : 1

                let currentAttemptNumber = 1
                let myLastAttemptNumber = 0
                if (_.isEmpty(lastResponse)) {
                  lastResponse = null
                } else {
                  nResponses += 1
                  myLastAttemptNumber = lastResponse.attempt
                  currentAttemptNumber = myLastAttemptNumber
                  if (this.state.questionsToTryAgain[qId] && myLastAttemptNumber < maxAttempts &&
                      lastResponse.correct === false && maxAttempts > 1 && myLastAttemptNumber > 0) {
                    currentAttemptNumber = myLastAttemptNumber + 1
                  }
                }

                const points = (q.sessionOptions && ('points' in q.sessionOptions)) ? q.sessionOptions.points : 1
                // only show correct if there is more than 1 attempt
                const correct = (lastResponse && maxAttempts > 1 && lastResponse.correct)
                const askForNewAttempt = (lastResponse && myLastAttemptNumber === currentAttemptNumber &&
                                          myLastAttemptNumber < maxAttempts && !correct)
                const response = lastResponse && currentAttemptNumber === myLastAttemptNumber ? lastResponse : null

                const toggleTryAgain = () => this.toggleTryAgain(qId)
                const doNothing = () => {}
                const toggleOnSubmit = currentAttemptNumber > myLastAttemptNumber && myLastAttemptNumber > 0

                const questionDisplay = user.isInstructor(session.courseId)
                  ? <QuestionDisplay question={q} readonly />
                  : <QuestionDisplay question={q} response={response} attemptNumber={currentAttemptNumber}
                    onSubmit={toggleOnSubmit ? toggleTryAgain : doNothing} />

                let questionClassName = 'ql-session-question'
                if (!lastResponse) {
                  questionClassName += ' not-submitted'
                } else if ((lastResponse && askForNewAttempt) || (currentAttemptNumber > myLastAttemptNumber && myLastAttemptNumber > 0)) {
                  questionClassName += ' try-again'
                } else {
                  questionClassName += ' submitted'
                }

                const attemptText = maxAttempts > 1 ? ', Attempt ' + currentAttemptNumber + ' of ' + maxAttempts : ''

                return (
                  <div className={questionClassName} key={'qlist_' + qId}>
                    <div className='ql-session-question-title'>
                        Question: {qCount + '/' + qLength} (worth {points} point{points !== 1 ? 's' : ''}) {attemptText}
                    </div>
                    { q ? questionDisplay : '' }
                    { askForNewAttempt
                        ? <div className='bottom-buttons'>
                          <button className='btn btn-primary try-again-button' onClick={toggleTryAgain}>
                                 Try again!
                               </button>
                        </div>
                        : ''
                      }
                  </div>)
              })
            }
          </div>
          <div className={nResponses === qLength ? 'ql-quiz-summary done' : 'ql-quiz-summary not-done'}>
            Answered {nResponses} out of {qLength} <br />
            { nResponses === qLength
              ? <div className='btn btn-secondary' onClick={() => { Router.go('/course/' + this.props.session.courseId) }}>
                  Done!
                </div>
              : ''
            }
          </div>
        </div>)
        */
    }
  }
}

// meteor reactive data container
export const Session = createContainer((props) => {
  const handle = Meteor.subscribe('sessions.single', props.sessionId) &&
                 Meteor.subscribe('questions.inSession', props.sessionId) &&
                 Meteor.subscribe('responses.forSession', props.sessionId)

  const session = Sessions.findOne({ _id: props.sessionId })
  const questionsInSession = Questions.find({_id: { $in: session.questions }}).fetch()
  // The user's responses
  const allMyResponses = Responses.find({ questionId: { $in: session.questions }, studentUserId: Meteor.userId() }).fetch()
  // calculate the statistics for each question (only if not in a quiz):
  let responseStatsByQuestion = []
  if (!session.quiz) {
    // all responses if we need to calculate stats
    const allResponses = Responses.find({questionId: { $in: session.questions }}).fetch()
    questionsInSession.forEach((question) => {
      let attemptNumber = (question && question.sessionOptions && question.sessionOptions.attempts)
        ? question.sessionOptions.attempts.length
        : 0
      responseStatsByQuestion[question._id] = responseDistribution(allResponses, question, attemptNumber)
    })
  }

  return {
    questions: _.indexBy(questionsInSession, '_id'), // question map
    session: session, // session object
    myResponses: allMyResponses, // responses related to this session
    responseStatsByQuestion: responseStatsByQuestion,
    loading: !handle.ready()
  }
}, _Session)
