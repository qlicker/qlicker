// QLICKER
// Author: Enoch T <me@enocht.am>
//
// run_session.jsx: page for managing a currently running session

import React, { Component } from 'react'
import { _ } from 'underscore'
import ReactTooltip from 'react-tooltip'

import { createContainer } from 'meteor/react-meteor-data'

import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'
import { Responses, responseDistribution } from '../../../api/responses'

import { QuestionListItem } from '../../QuestionListItem'
import { QuestionDisplay } from '../../QuestionDisplay'
import { AnswerDistribution } from '../../AnswerDistribution'
import { ShortAnswerList } from '../../ShortAnswerList'

import { QUESTION_TYPE } from '../../../configs'

class _RunSession extends Component {

  constructor (props) {
    super(props)

    this.state = { presenting: false, session: _.extend({}, this.props.session) }

    this.sessionId = this.props.sessionId

    this.removeQuestion = this.removeQuestion.bind(this)
    this.toggleStats = this.toggleStats.bind(this)
    this.onSortQuestions = this.onSortQuestions.bind(this)
    this.setCurrentQuestion = this.setCurrentQuestion.bind(this)
    this.prevQuestion = this.prevQuestion.bind(this)
    this.nextQuestion = this.nextQuestion.bind(this)
    this.endSession = this.endSession.bind(this)
    this.newAttempt = this.newAttempt.bind(this)
    this.toggleHidden = this.toggleHidden.bind(this)
    this.toggleCorrect = this.toggleCorrect.bind(this)
    this.toggleAttempt = this.toggleAttempt.bind(this)
    this.routeMobile = this.routeMobile.bind(this)
    this.routeDesktop = this.routeDesktop.bind(this)

    Meteor.call('questions.startAttempt', this.state.session.currentQuestion)
  }

  /**
   * removeQuestion(MongoId (string): questionId)
   * calls sessions.removeQuestion to remove from session
   */
  removeQuestion (questionId) {
    Meteor.call('sessions.removeQuestion', this.sessionId, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Removed')
    })
  }

  /**
   * routeMobile
   * Routes to the mobile version
   */
  routeMobile () {
    Router.go('session.run.mobile', {_id: this.props.session._id})
  }

  /**
   * routeDesktop
   * Routes to the desktop version
   */
  routeDesktop () {
    Router.go('session.run', {_id: this.props.session._id})
  }
  /**
   * toggleStats(MongoId (string): questionId)
   * calls questions.showStats or .hideStats to show/hide answer distribution from students
   */
  toggleStats (questionId) {
    const sessionOptions = this.props.questions[questionId].sessionOptions
    if (!sessionOptions || !sessionOptions.stats) {
      Meteor.call('questions.showStats', questionId, (error) => {
        if (error) alertify.error('Error: ' + error.error)
        else alertify.success('Enabled Stats')
      })
    } else {
      Meteor.call('questions.hideStats', questionId, (error) => {
        if (error) alertify.error('Error: ' + error.error)
        else alertify.success('Disabled stats')
      })
    }
  }

  /**
   * toggleHidden(MongoId (string): questionId)
   * calls questions.hideQuestion or .showQuestion to show/hide question display
   */
  toggleHidden (questionId) {
    const sessionOptions = this.props.questions[questionId].sessionOptions
    if (!sessionOptions || !sessionOptions.hidden) {
      Meteor.call('questions.hideQuestion', questionId, (error) => {
        if (error) alertify.error('Error: ' + error.error)
        else alertify.success('Question Hidden')
      })
    } else {
      Meteor.call('questions.showQuestion', questionId, (error) => {
        if (error) alertify.error('Error: ' + error.error)
        else alertify.success('Question Visible')
      })
    }
  }

  /**
   * toggleAttempt(MongoId (string): questionId)
   * toggle closed/open for latest question attempt
   */
  toggleAttempt (questionId) {
    const current = this.state.session.currentQuestion
    const q = this.props.questions[current]
    const currentAttempt = q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1]
    Meteor.call('questions.setAttemptStatus', questionId, !currentAttempt.closed, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success(currentAttempt.closed ? 'Answering Enabled' : 'Answering Disabled')
    })
  }

  /**
   * newAttempt(MongoId (string): questionId)
   * create a new 'attempt' for a specific question and end (stop allowing submission on old one)
   */
  newAttempt () {
    const qId = this.state.session.currentQuestion
    Meteor.call('questions.setAttemptStatus', qId, true, (error) => {
      if (error) return alertify.error('Error: ' + error.error)
      Meteor.call('questions.startAttempt', qId, (error) => {
        if (error) alertify.error('Error: ' + error.error)
        else {
          Meteor.call('questions.hideCorrect', qId, (error) => {
            if (error) return alertify.error('Error: ' + error.error)
          })
          Meteor.call('questions.hideStats', qId, (error) => {
            if (error) return alertify.error('Error: ' + error.error)
          })
          alertify.success('New Attempt')
        }
      })
    })
  }

  /**
   * toggleCorrect(MongoId (string): questionId)
   * calls questions.hideCorrect or .showCorrect to show/hide correct quesiton option
   */
  toggleCorrect (questionId) {
    const sessionOptions = this.props.questions[questionId].sessionOptions
    if (!sessionOptions || sessionOptions.correct) {
      Meteor.call('questions.hideCorrect', questionId, (error) => {
        if (error) alertify.error('Error: ' + error.error)
        else alertify.success('Correct Answer Hidden')
      })
    } else {
      Meteor.call('questions.showCorrect', questionId, (error) => {
        if (error) alertify.error('Error: ' + error.error)
        else alertify.success('Correct Answer Visible')
      })
    }
  }

  /**
   * onSortQuestions([Sort Object (ref <DragSortableList/>)]: sorted)
   * handler for drag and drop sorter, calls sessions.batchEdit
   */
  onSortQuestions (sorted) {
    const questionIdList = _(sorted).pluck('id')

    const session = this.state.session
    session.questions = questionIdList
    this.setState({ session: session })

    Meteor.call('sessions.batchEdit', this.sessionId, questionIdList, (e) => {
      if (e) alertify.error('An error occured while reordering questions')
      else alertify.success('Order Saved')
    })
  }

  /**
   * setCurrentQuestion(MongoId (string): questionId)
   * calls sessions.setCurrent to set current question running in session
   */
  setCurrentQuestion (questionId) {
    Meteor.call('sessions.setCurrent', this.state.session._id, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Set Current')
    })
  }

  /**
   * prevQuestion()
   * set question to previous in list
   */
  prevQuestion () {
    const currentIndex = this.state.session.questions.indexOf(this.state.session.currentQuestion)
    if (currentIndex > 0) this.setCurrentQuestion(this.state.session.questions[currentIndex - 1])
  }

  /**
   * nextQuestion()
   * set question to next in list
   */
  nextQuestion () {
    const l = this.state.session.questions.length
    const currentIndex = this.state.session.questions.indexOf(this.state.session.currentQuestion)
    if (currentIndex < l - 1) this.setCurrentQuestion(this.state.session.questions[currentIndex + 1])
  }

  /**
   * endSession()
   * close session, set to inactive
   */
  endSession () {
    const sessionId = this.state.session._id
    Meteor.call('sessions.endSession', sessionId, (error) => {
      if (error) return alertify.error('Error: could not end session ')
      alertify.success('Session Ended')
      Router.go('course', { _id: this.state.session.courseId })
    })
    if (!this.state.session.reviewable) {
      // by default, do not change reviability, but do remind prof if not reviewable:
      alertify.error('Warning: session not reviewable')
    }
  }

  // TODO: This should not get called when ending a session (it does), which makes
  // it call startAttempt, which it should not!
  componentWillReceiveProps (nextProps) {
    if (nextProps && nextProps.session) {
      this.setState({ session: nextProps.session }, () => {
        const current = this.state.session.currentQuestion
        const q = this.props.questions[current]
        if (!q || !q.sessionOptions || !q.sessionOptions.attempts) {
          Meteor.call('questions.startAttempt', this.state.session.currentQuestion)
        }
      })
    }
  }
  renderMobile () {
    // TODO: Add some styling... this is barebones and needs some css to look nicer...

    if (this.state.session.status !== 'running') return <div className='ql-subs-loading'>Session not running</div>
    const current = this.state.session.currentQuestion
    if (this.props.loading || !current) return <div className='ql-subs-loading'>Loading</div>

    let questionList = this.state.session.questions || []

    const q = this.props.questions[current]
    if (!q.sessionOptions) return <div>Loading</div>
    const currentAttempt = q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1]
    const currentAttemptNumber = q.sessionOptions.attempts.length
    const responseStats = _(this.props.responseStatsByQuestion[q._id]).where({ attempt:currentAttemptNumber })
    // strings
    const strQuestionVisible = q.sessionOptions.hidden ? 'Show Question' : 'Hide Question'
    const strCorrectVisible = q.sessionOptions.correct ? 'Hide Correct' : 'Show Correct'
    const strStatsVisible = q.sessionOptions.stats ? 'Hide Stats' : 'Show Stats'
    const strAttemptEnabled = currentAttempt.closed ? 'Allow responses' : 'Disallow responses'

    const numAnswered = this.props.responseCounts[q._id][currentAttemptNumber]
    const numJoined = this.props.session.joined ? this.props.session.joined.length : 0

    return (
      <div className='container ql-session-display'>
        <div className='ql-session-display-mobile'>
          <div className='ql-session-display-mobile-infobar'>
            <a className='toolbar-button' href='#' onClick={this.routeDesktop}>
              <span className='glyphicon glyphicon-fullscreen' />&nbsp;
              Desktop view
            </a>&nbsp;&nbsp;&nbsp;&nbsp;
            <span className='glyphicon glyphicon-user' />&nbsp;{ numJoined }&nbsp;&nbsp;
            Question: {questionList.indexOf(current) + 1}/{questionList.length}&nbsp;&nbsp;
            Responses: <span className='glyphicon glyphicon-check' />&nbsp;{numAnswered}/{numJoined}&nbsp;&nbsp;
            Attempt: {q.sessionOptions.attempts.length}
          </div>
          <div className='ql-session-display-mobile-buttons'>
            <div className='btn-group btn-group-justified'>
              <div className='btn btn-default' onClick={this.newAttempt}>
                New attempt
              </div>
              <div className='btn btn-default' onClick={() => this.toggleAttempt(q._id)}>
                {strAttemptEnabled}
              </div>
            </div>
            <div className='btn-group btn-group-justified'>
              <div className='btn btn-default' onClick={() => { this.toggleStats(q._id) }}>
                {strStatsVisible}
              </div>
              <div className='btn btn-default' onClick={() => { this.toggleCorrect(q._id) }}>
                {strCorrectVisible}
              </div>
            </div>
            <div className='btn-group btn-group-justified'>
              <div className='btn btn-default' onClick={this.prevQuestion}>
                <span className='glyphicon glyphicon-arrow-left' /> &nbsp;  Previous
              </div>
              <div className='btn btn-default' onClick={() => this.toggleHidden(q._id)}>
                {strQuestionVisible}
              </div>
              <div className='btn btn-default' onClick={this.nextQuestion}>
                Next &nbsp;<span className='glyphicon glyphicon-arrow-right' />
              </div>
            </div>
          </div>

          <div className='ql-question-preview'>
            { q ? <QuestionDisplay question={q} responseStats={responseStats} readonly prof showStatsOverride /> : '' }
          </div>
          {
            !this.state.presenting && q && q.type === QUESTION_TYPE.SA // short answer
            ? <div><ShortAnswerList question={q} /></div>
            : ''
          }
          <div className='ql-session-display-mobile-buttons'>
            <div className='btn-group-lg btn-group-justified'>
              <div className='btn btn-default' onClick={this.endSession}>
                <span className='glyphicon glyphicon-stop' />&nbsp;
                Finish Session
              </div>
            </div>
          </div>
        </div>
      </div>)
  }

  render () {
    if (this.props.mobile) return this.renderMobile()
    if (this.state.session.status !== 'running') return <div className='ql-subs-loading'>Session not running</div>
    const current = this.state.session.currentQuestion
    if (this.props.loading || !current) return <div className='ql-subs-loading'>Loading</div>

    let questionList = this.state.session.questions || []

    const q = this.props.questions[current]
    if (!q || !q.sessionOptions) return <div>Loading</div>
    const currentAttempt = q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1]
    const currentAttemptNumber = q.sessionOptions.attempts.length

    const responseStats = q.sessionOptions.stats
                          ? _(this.props.responseStatsByQuestion[q._id]).where({ attempt:currentAttemptNumber })
                          : null

    // strings
    const strQuestionVisible = q.sessionOptions.hidden ? 'Show Question' : 'Hide Question'
    const strCorrectVisible = q.sessionOptions.correct ? 'Hide Correct' : 'Show Correct'
    const strStatsVisible = q.sessionOptions.stats ? 'Hide Stats' : 'Show Stats'
    const strAttemptEnabled = currentAttempt.closed ? 'Allow Responses' : 'Disallow Responses'

    const numAnswered = this.props.responseCounts[q._id][currentAttemptNumber]
    const numJoined = this.props.session.joined ? this.props.session.joined.length : 0

    const students = Meteor.users.find({ _id: { $in: this.state.session.joined || [] } }, { sort: { 'profile.lastname': 1 } }).fetch()

    // small methods
    const secondDisplay = () => { window.open('/session/present/' + this.state.session._id, 'Qlicker', 'height=768,width=1024') }
    const togglePresenting = () => { this.setState({ presenting: !this.state.presenting }) }
    return (
      <div className='ql-manage-session'>
        <div className='ql-session-toolbar'>
          <h3 className='session-title'>{ this.state.session.name }</h3>
          <span className='divider'>&nbsp;</span>
          <span className='toolbar-button' onClick={() => Router.go('session.edit', { _id: this.state.session._id })}>
            <span className='glyphicon glyphicon-edit' />&nbsp;
            Edit Session
          </span>
          <span className='divider'>&nbsp;</span>
          <span data-tip data-for='students' className='session-title'><span className='glyphicon glyphicon-user' />&nbsp;{ numJoined }</span>
          <ReactTooltip id='students' place='bottom' type='dark' effect='solid'>
            {students.map((student) =>
              <div key={student._id}>
                <p>{student.profile.lastname + ', ' + student.profile.firstname}</p>
              </div>
            )}
          </ReactTooltip>
          <span className='divider'>&nbsp;</span>
          <span className='toolbar-button' onClick={this.endSession}>
            <span className='glyphicon glyphicon-stop' />&nbsp;
            Finish Session
          </span>
          <span className='toolbar-button' onClick={togglePresenting}>
            <span className='glyphicon glyphicon-fullscreen' />&nbsp;
            Presentation Mode
          </span>
          <span className='toolbar-button' onClick={secondDisplay}>
            <span className='glyphicon glyphicon-blackboard' />&nbsp;
            2nd Display
          </span>
          <a className='toolbar-button' href='#' onClick={this.routeMobile}>
            <span className='glyphicon glyphicon-phone' />&nbsp;
            Mobile view
          </a>
        </div>

        <div className='ql-row-container'>
          <div className='ql-question-toolbar'>
            <h3 className='question-number'>Question {questionList.indexOf(current) + 1}/{questionList.length}</h3>
            <span className='divider'>&nbsp;</span>
            <div className='student-counts'><span className='glyphicon glyphicon-check' />&nbsp;{numAnswered}/{numJoined}</div>
            <span className='divider'>&nbsp;</span>
            <a href='#' className='toolbar-button next' onClick={this.prevQuestion}><span className='glyphicon glyphicon-arrow-left' />&nbsp; Previous</a>
            <a href='#' className='toolbar-button prev' onClick={this.nextQuestion}>Next &nbsp;<span className='glyphicon glyphicon-arrow-right' /></a>
            <span className='divider'>&nbsp;</span>
            <a href='#' className='toolbar-button' onClick={() => this.toggleHidden(q._id)}>{strQuestionVisible}</a>
            <a href='#' className='toolbar-button' onClick={() => this.toggleCorrect(q._id)}>{strCorrectVisible}</a>
            <a href='#' className='toolbar-button' onClick={() => this.toggleStats(q._id)}>{strStatsVisible}</a>
            <span className='divider'>&nbsp;</span>
            <a href='#' className='toolbar-button' onClick={() => this.toggleAttempt(q._id)}>{strAttemptEnabled}</a>
            <a href='#' className='toolbar-button' onClick={this.newAttempt}>New Attempt</a>
            <span className='attempt-message'>Attempt ({currentAttempt.number})</span>
            <span className='divider'>&nbsp;</span>
          </div>

          <div className='ql-sidebar-container with-2nd-toolbar'>
            <div className={'ql-session-sidebar' + (this.state.presenting ? 'presenting' : '')}>
              {
                !this.state.presenting
                ? <div>
                  <h3>Questions</h3>
                  <div className='ql-session-question-list'>
                    {
                      questionList.map((questionId) => {
                        const q = this.props.questions[questionId]
                        if (q._id === this.state.session.currentQuestion) {
                          return <div key={q._id} className='current-question-list-item'><QuestionListItem session={this.props.session} question={q} click={() => this.setCurrentQuestion(q._id)} /></div>
                        } else return <QuestionListItem session={this.props.session} key={q._id} question={q} click={() => this.setCurrentQuestion(q._id)} />
                      })
                    }
                  </div>
                  <hr />
                </div>
                : ''
              }
            </div>
          </div>

          <div className={'ql-main-content ' + (this.state.presenting ? 'presenting' : '')}>
            {
              !this.state.presenting && q && q.type !== QUESTION_TYPE.SA // option based questions
              ? <div><AnswerDistribution question={q} title='Responses' responseStats={this.props.responseStatsByQuestion[q._id]} /><div className='clear' /></div>
              : ''
            }
            {
              !this.state.presenting && q && q.type === QUESTION_TYPE.SA // short answer
              ? <div><ShortAnswerList question={q} /></div>
              : ''
            }

            <div className='ql-question-preview'>
              { q ? <QuestionDisplay question={q} responseStats={responseStats} readonly prof /> : '' }
            </div>
          </div>

        </div>
      </div>)
  }

}

export const RunSession = createContainer((props) => {
  const handle =  Meteor.subscribe('sessions.single',props.sessionId)
    Meteor.subscribe('questions.library') &&
    Meteor.subscribe('responses.forSession', props.sessionId) &&
    Meteor.subscribe('users.studentsInCourse', props.courseId)

  const session = Sessions.findOne(props.sessionId)
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()
  const questions = _.indexBy(questionsInSession, '_id')

  const allResponses = Responses.find({ questionId:{ $in: session.questions }}).fetch()
  const responsesByQuestion = _(allResponses).groupBy('questionId')
  let responseStatsByQuestion = []
  const responseCounts = []
  questionsInSession.forEach( (question) => {
    responseStatsByQuestion[question._id] = responseDistribution(responsesByQuestion[question._id], question)
    responseCounts[question._id] = _(responsesByQuestion[question._id]).countBy('attempt')
  })



//  const responseCounts = _(allResponses).countBy('questionId')

/*
  let responses = []
  const q = questions[session.currentQuestion]
  if (session.currentQuestion && q && q.sessionOptions) {
    const maxAttempt = questions[session.currentQuestion].sessionOptions.attempts.length
    responses = Responses.find({ attempt: maxAttempt, questionId: session.currentQuestion }).fetch()
  }
*/
  return {
    questions: questions,
    responseCounts: responseCounts,
    responseStatsByQuestion: responseStatsByQuestion,
    session: session,
    loading: !handle.ready()
  }
}, _RunSession)
