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
import { Responses } from '../../../api/responses'

import { QuestionDisplay } from '../../QuestionDisplay'
import { QUESTION_TYPE } from '../../../configs'

class _Session extends Component {

  constructor (props) {
    super(props)

    this.state = { submittingQuestion: false }

    if (this.props.user.hasRole('student')) Meteor.call('sessions.join', this.props.session._id, Meteor.userId())
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const status = this.props.session.status
    if (status !== 'running') {
      let statusMessage

      if (status === 'visible') statusMessage = 'This session has not started yet. You can keep this page open until your professor starts the session or check back soon.'
      if (status === 'done') {
        statusMessage = 'This session has finished'
        let user = Meteor.user()
        let cId = this.props.session.courseId
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
      const current = this.props.session.currentQuestion
      const q = current ? this.props.questions[current] : null
      const responses = _.where(this.props.responses, { questionId:q._id, studentUserId: Meteor.user()._id  })
      let lastResponse = _.max(responses, (resp) => { return resp.attempt })
      if (!(lastResponse.attempt > 0)) lastResponse = null
      const questionDisplay = this.props.user.isInstructor(session.courseId)
        ? <QuestionDisplay question={q} readonly />
        : <QuestionDisplay question={q} response={lastResponse} distribution={this.props.responseStats[q._id]} />
      return (
        <div className='container ql-session-display'>
          { q ? questionDisplay : '' }
        </div>)
    }else{
      const qlist = session.questions
      let qCount = 0
      const qLength = qlist.length
      return( <div className='container ql-session-display'>
        {
          qlist.map( (qId) => {
            qCount += 1
            const q = this.props.questions[qId]
            const responses = _.where(this.props.responses, { questionId:qId, studentUserId: Meteor.user()._id  })
            const lastResponse = _.max(responses, (resp) => { return resp.attempt })
            const currentAttempt = lastResponse && lastResponse.attempt ? lastResponse.attempt : 1
            const points = (q.sessionOptions && q.sessionOptions.points) ? q.sessionOptions.points : 1
            const correct =  (lastResponse && lastResponse.correct) ? '(Correct)' : ''
            const maxAttempts = (q.sessionOptions && q.sessionOptions.maxAttempts) ? q.sessionOptions.maxAttempts : 1
            const questionDisplay = this.props.user.isInstructor(session.courseId)
              ? <QuestionDisplay question={q} readonly />
              : <QuestionDisplay question={q} response={lastResponse} distribution={this.props.responseStats[q._id]} />
              return (
                <div key={"qlist_"+qId}>
                  <div className = 'ql-session-question-title'>
                    Question: {qCount+"/"+qLength} ({points} points), Attempt {currentAttempt} of {maxAttempts} {correct}
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

  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
  let user = Meteor.user()
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()
  //const responses = Responses.find({ questionId:{ $in: session.questions }, studentUserId: user._id }).fetch()
  const allResponses = Responses.find({ questionId:{ $in: session.questions }}).fetch()
  // calculate the statistics for each question:
  let formattedData = []
  questionsInSession.forEach( (question) => {

    formattedData[question._id] = []

    let attemptNumber = (question && question.sessionOptions && question.sessionOptions.attempts)
      ? question.sessionOptions.attempts.length
      : 0
    // If the question has a max number of attempts, the current attempt number is the user's last attempt
    if (question && question.sessionOptions && question.sessionOptions.maxAttempts > 1){
      const allmyResponses = _(allResponses).findWhere({ questionId: question._id, studentUserId: Meteor.userId() })
      const myLastResponse= _.max(allmyResponses, (resp) => { return resp.attempt })
      attemptNumber = myLastResponse && myLastResponse.attempt < question.sessionOptions.maxAttempts + 1
        ? myLastResponse.attempt
        : 0
    }
    const responses = _(allResponses).findWhere({ questionId: question._id, attempt:attemptNumber })


    if (responses && question.type !== QUESTION_TYPE.SA && question.sessionOptions) {
      // Get the valid options for the question (e.g A, B, C)
      const validOptions = _(question.options).pluck('answer')
      // Get the total number of responses:
      total = responses.length
      let answerDistribution = {}

      // pull out all the answers from the responses, this gives an array of arrays of answers
      // e.g. [[A,B], [B], [B,C]], then flatten it
      let allAnswers = _(_(responses).pluck('answer')).flatten()
      // then we count each occurrence of answer in the array
      // we add a new key to answerDistribution if it that answer doesn't exist yet, or increment otherwise
      allAnswers.forEach((a) => {
        if (answerDistribution[a]) answerDistribution[a] += 1
        else answerDistribution[a] = 1
      })

      validOptions.forEach((o) => {
        if (!answerDistribution[o]) answerDistribution[o] = 0
        let pct = Math.round(100.0 * (total !== 0 ? answerDistribution[o] / total : 0))
        // counts does not need to be an array, but leave the flexibility to be able to hold
        // the values for more than one attempt
        formattedData[question._id].push({ answer: o, counts: [ {attempt: attemptNumber, count: answerDistribution[o], pct: pct} ] })
      })
    }
  })

  return {
    questions: _.indexBy(questionsInSession, '_id'), // question map
    user: user, // user object
    session: session, // session object
    responses: allResponses, // responses related to this session
    responseStats: formattedData,
    loading: !handle.ready()
  }
}, _Session)
