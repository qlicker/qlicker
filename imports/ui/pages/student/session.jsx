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

import { QuestionDisplay } from '../../QuestionDisplay'
import { QUESTION_TYPE } from '../../../configs'

class _Session extends Component {

  constructor (props) {
    super(props)

    this.state = { submittingQuestion: false, tryAgain: false }
    this.tryAgain = this.tryAgain.bind(this)
    // TODO: not sure this is the right point to join...
    if (Meteor.user().isStudent(this.props.session.courseId)) Meteor.call('sessions.join', this.props.session._id, Meteor.userId())
  }

  tryAgain (a) {
    this.setState({ tryAgain:a })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const cId = this.props.session.courseId
    const user = Meteor.user()
    if (!user.isStudent(cId) && !user.isInstructor(cId)){
      Router.go('login')
    }
    const status = this.props.session.status
    if (status !== 'running') {
      let statusMessage

      if (status === 'visible') statusMessage = 'This session has not started yet. You can keep this page open until your professor starts the session or check back soon.'
      if (status === 'done') {
        statusMessage = 'This session has finished'
        if (user && !user.isInstructor(cId)) {
          // if it's an instructor, this is being shown as a second display, so dont't
          // go to the course page and show everyone the class list
          Router.go('/course/' + this.props.session.courseId)
        }
      }
      return <div className='ql-subs-loading'>{statusMessage}</div>
    }
    const session = this.props.session

    if( !session.quiz ){
      // For questions asked in-class
      const current = this.props.session.currentQuestion
      const q = this.props.questions[current]
      if (!q || !q.sessionOptions) return <div className='ql-subs-loading'>Loading</div>

      const responses =  _.where(this.props.myResponses, { questionId:q._id })
      let lastResponse = _.max(responses, (resp) => { return resp.attempt })
      if (!(lastResponse.attempt > 0)) lastResponse = null

      // Determine the current attempt and whether the user has responded to that attempt
      // The current attempt is based on the sessionOptions of the question, and is always
      // the total number of attempts
      const currentAttemptNumber = q.sessionOptions.attempts.length
      const myLastAttemptNumber = lastResponse && lastResponse.attempt > 0 ? lastResponse.attempt : 0
      const response = myLastAttemptNumber < currentAttemptNumber ? null : lastResponse

      const responseStats = q.sessionOptions.stats ? this.props.responseStatsByQuestion[q._id] : null
      const questionDisplay = user.isInstructor(session.courseId)
        ? <QuestionDisplay question={q} readonly />
        : <QuestionDisplay question={q} attemptNumber={currentAttemptNumber} response={response} responseStats={responseStats} />
      return (
        <div className='container ql-session-display'>
          { questionDisplay }
        </div>)
    }else{
      // for questions in a quiz (all questions at once, possible multiple attempts allowed)
      const qlist = session.questions
      let qCount = 0
      const qLength = qlist.length
      return( <div className='container ql-session-display'>
        {
          qlist.map( (qId) => {
            qCount += 1
            const q = this.props.questions[qId]
            if (!q || !q.sessionOptions) return <div className='ql-subs-loading'>Loading</div>
            // Get all the responses for this question, and the last one:
            const responses = _.where(this.props.myResponses, { questionId:qId, studentUserId: Meteor.user()._id  })
            let lastResponse = _.max(responses, (resp) => { return resp.attempt })
            if (!(lastResponse.attempt > 0)) lastResponse = null

            const myLastAttemptNumber = lastResponse && lastResponse.attempt ? lastResponse.attempt : 1
            let response = lastResponse ? lastResponse : null

            const points = (q.sessionOptions && q.sessionOptions.points) ? q.sessionOptions.points : 1

            const maxAttempts =  q.sessionOptions.maxAttempts ? q.sessionOptions.maxAttempts : 1
            // only show correct if there is more than 1 attempt
            const correct =  (response && maxAttempts > 1 && response.correct)
            const askForNewAttempt = (response && myLastAttemptNumber<maxAttempts && !correct )

            const questionDisplay = user.isInstructor(session.courseId)
              ? <QuestionDisplay question={q} readonly />
              : <QuestionDisplay question={q} response={lastResponse} attemptNumber={currentAttemptNumber} askForNewAttempt={askForNewAttempt} />

            return (
                <div key={"qlist_"+qId}>
                  <div className = 'ql-session-question-title'>
                    Question: {qCount+"/"+qLength} ({points} points), Attempt {currentAttempt} of {maxAttempts} {correct ? 'Correct': ''}
                  </div>
                  { q ? questionDisplay : '' }
                </div>)
          })
        }
        </div>)
    }
  }
}

// meteor reactive data container
export const Session = createContainer((props) => {
  const handle = Meteor.subscribe('sessions.single', props.sessionId) &&
    Meteor.subscribe('questions.inSession', props.sessionId)
    Meteor.subscribe('responses.forSession', props.sessionId)

  const session = Sessions.findOne({ _id: props.sessionId })
  const questionsInSession = Questions.find({ _id: { $in: session.questions }}).fetch()
  // The user's responses
  const allMyResponses = Responses.find({ questionId:{ $in: session.questions }, studentUserId: Meteor.userId() }).fetch()
  // calculate the statistics for each question (only if not in a quiz):
  let responseStatsByQuestion = []
  if (!session.quiz) {
    // all responses if we need to calculate stats
    const allResponses = Responses.find({ questionId:{ $in: session.questions }}).fetch()
    questionsInSession.forEach( (question) => {
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
