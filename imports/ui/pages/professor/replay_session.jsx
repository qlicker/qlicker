// QLICKER
// Author: Enoch T <me@enocht.am>
//
// run_session.jsx: page for managing a currently running session

import React, { Component } from 'react'
import _ from 'underscore'
//import ReactTooltip from 'react-tooltip'

import { withTracker }  from 'meteor/react-meteor-data'

import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'
import { Responses, responseDistribution } from '../../../api/responses'
import { CheckBoxOption, CleanTooltip } from '../../CleanForm'

import { QuestionListItem } from '../../QuestionListItem'
import { QuestionDisplay } from '../../QuestionDisplay'
import { AnswerDistribution } from '../../AnswerDistribution'
import { ShortAnswerList } from '../../ShortAnswerList'
import { HistogramNumerical } from '../../HistogramNumerical'

import { QUESTION_TYPE } from '../../../configs'

class _ReplaySession extends Component {

  constructor (props) {
    super(props)

    this.state = { currentQuestion: 0, showStats: false, showCorrect:false }

    this.sessionId = this.props.sessionId

    this.toggleStats = this.toggleStats.bind(this)
    this.prevQuestion = this.prevQuestion.bind(this)
    this.nextQuestion = this.nextQuestion.bind(this)
  }
  
  toggleStats () {
    this.setState({showStats:!this.state.showStats})
  }

  prevQuestion () {
    const currentQuestion = this.state.currentQuestion
    if (currentQuestion > 0) this.setState({currentQuestion:currentQuestion-1})
  }

  nextQuestion () {
    const l = this.props.session.questions.length
    const currentQuestion = this.state.currentQuestion
    if (currentQuestion < l - 1) this.setState({currentQuestion:currentQuestion+1})
  }


  render () {
    const current = this.state.currentQuestion

    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    let questionList = this.props.session.questions || []

    const q = this.props.questions[current]

    if (!q.sessionOptions) return <div>Loading</div>

    const currentAttemptNumber = q.sessionOptions.attempts.length
    const responseStats = _(this.props.responseStatsByQuestion[q._id]).where({ attempt: currentAttemptNumber })
    // strings
    const strStatsVisible = this.state.showStats ? 'Hide Stats' : 'Show Stats'

    const numAnswered = this.props.responseCounts[q._id][currentAttemptNumber]
    const numJoined = this.props.session.joined ? this.props.session.joined.length : 0

    return (
      <div className='container ql-session-display'>
        <div className='ql-session-display-mobile'>
          <div className='ql-session-display-mobile-infobar'>
            <span className='glyphicon glyphicon-user' />&nbsp;{ numJoined }&nbsp;&nbsp;
            Question: {current + 1}/{questionList.length}&nbsp;&nbsp;
            Responses: <span className='glyphicon glyphicon-check' />&nbsp;{numAnswered}/{numJoined}&nbsp;&nbsp;
            Attempt: {q.sessionOptions.attempts.length}
          </div>
          <div className='ql-session-display-mobile-buttons'>
            <div className='btn-group btn-group-justified'>
              <div className='btn btn-default' onClick={() => { this.toggleStats(q._id) }}>
                {strStatsVisible}
              </div>
            </div>
            <div className='btn-group btn-group-justified'>
              <div className='btn btn-default' onClick={this.prevQuestion}>
                <span className='glyphicon glyphicon-arrow-left' /> &nbsp;  Previous
              </div>
              <div className='btn btn-default' onClick={this.nextQuestion}>
                Next &nbsp;<span className='glyphicon glyphicon-arrow-right' />
              </div>
            </div>
          </div>

          <div className='ql-question-preview'>
            { q ? <QuestionDisplay question={q}
                     responseStats={responseStats}
                     readonly
                     forReview
                     showStatsOverride={this.state.showStats} /> : '' }
          </div>
          {
            q && q.type === QUESTION_TYPE.NU // short answer
            ? <div className='ql-session-display-histogram'><HistogramNumerical question={q} width={300} /></div>
            : ''
          }
        </div>
      </div>)
  }


}

export const ReplaySession = withTracker((props) => {
  const handle = Meteor.subscribe('sessions.single', props.sessionId)
  Meteor.subscribe('questions.library') &&
    Meteor.subscribe('responses.forSession', props.sessionId) &&
    Meteor.subscribe('users.studentsInCourse', props.courseId)

  const session = Sessions.findOne(props.sessionId)
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()
  const questions = _.indexBy(questionsInSession, '_id')

  const allResponses = Responses.find({questionId: { $in: session.questions }}).fetch()
  const responsesByQuestion = _(allResponses).groupBy('questionId')
  let responseStatsByQuestion = []
  const responseCounts = []
  questionsInSession.forEach((question) => {
    responseStatsByQuestion[question._id] = responseDistribution(responsesByQuestion[question._id], question)
    responseCounts[question._id] = _(responsesByQuestion[question._id]).countBy('attempt')
  })

  return {
    questions: questionsInSession,
    responseCounts: responseCounts,
    responseStatsByQuestion: responseStatsByQuestion,
    session: session,
    loading: !handle.ready()
  }
})(_ReplaySession)
