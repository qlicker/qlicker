// QLICKER
// Author: Enoch T <me@enocht.am>
//
// run_session.jsx: page for managing a currently running session

import React, { Component } from 'react'
import { _ } from 'underscore'

import { createContainer } from 'meteor/react-meteor-data'

import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'

import { QuestionListItem } from '../../QuestionListItem'
import { QuestionDisplay } from '../../QuestionDisplay'
import { AnswerDistribution } from '../../AnswerDistribution'

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
      else alertify.success(!currentAttempt.closed ? 'Answering Enabled' : 'Answering Disabled')
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
        else alertify.success('New Attempt')
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
    Meteor.call('sessions.endSession', this.state.session._id, (error) => {
      if (error) return alertify.error('Error: could not end session ')
      alertify.success('Session Ended')
      Router.go('professor') // TODO go to grades overview page for that session
    })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps && nextProps.session) {
      this.setState({ session: nextProps.session }, () => {
        const current = this.state.session.currentQuestion
        const q = this.props.questions[current]
        if (!q.sessionOptions || !q.sessionOptions.attempts) {
          Meteor.call('questions.startAttempt', this.state.session.currentQuestion)
        }
      })
    }
  }

  render () {
    if (this.state.session.status !== 'running') return <div className='ql-subs-loading'>Session not running</div>
    const current = this.state.session.currentQuestion
    if (this.props.loading || !current) return <div className='ql-subs-loading'>Loading</div>

    let questionList = this.state.session.questions || []

    const q = this.props.questions[current]
    if (!q.sessionOptions) return <div>Loading</div>
    const currentAttempt = q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1]

    // strings
    const strQuestionVisible = q.sessionOptions.hidden ? 'Show Question' : 'Hide Question'
    const strCorrectVisible = q.sessionOptions.correct ? 'Hide Correct' : 'Show Correct'
    const strStatsVisible = q.sessionOptions.stats ? 'Hide Stats' : 'Show Stats'
    const strAttemptEnabled = currentAttempt.closed ? 'Allow Answers' : 'Disallow Answers'
    const strAttemptOpen = currentAttempt.closed ? 'Closed for Answers' : 'Open for Answers'

    // small methods
    const secondDisplay = () => { window.open('/session/present/' + this.state.session._id, 'Qlicker', 'height=768,width=1024') }
    const togglePresenting = () => { this.setState({ presenting: !this.state.presenting }) }

    // fragments
    const questionPreview = <div className='ql-question-preview'>{ q ? <QuestionDisplay question={q} attempt={currentAttempt} readonly prof /> : '' }</div>
    return (
      <div className='ql-manage-session'>

        <div className='ql-row-container'>
          <div className='ql-sidebar-container'>
            <div className={'ql-session-sidebar' + (this.state.presenting ? ' presenting' : '')}>
              <h2>Session: { this.state.session.name }</h2>
              <div className='btn-group btn-group-justified _display' role='group'>
                <a href='#' className='btn btn-default btn-sm' onClick={togglePresenting}>Presentation <span className='glyphicon glyphicon-fullscreen' /></a>
                <a href='#' className='btn btn-default btn-sm' onClick={secondDisplay}>2nd Display <span className='glyphicon glyphicon-blackboard' /></a>
              </div>
              <hr />
              <h3>Current Question</h3>
              <div className='btn-group btn-group-justified _questions' role='group'>
                <a href='#' className='btn btn-default btn-sm' onClick={() => this.toggleHidden(q._id)}>{strQuestionVisible}</a>
                <a href='#' className='btn btn-default btn-sm' onClick={() => this.toggleCorrect(q._id)}>{strCorrectVisible}</a>
                <a href='#' className='btn btn-default btn-sm' onClick={() => this.toggleStats(q._id)}>{strStatsVisible}</a>
              </div>
              <br />
              <div className='btn-group btn-group-justified _attempts' role='group'>
                <a href='#' className='btn btn-default btn-sm' onClick={() => this.toggleAttempt(q._id)}>{strAttemptEnabled}</a>
                <a href='#' className='btn btn-default btn-sm' onClick={this.newAttempt}>New Attempt</a>
              </div>
              <br />
              <div className='attempt-message'>
                Current Attempt ({currentAttempt.number}): {strAttemptOpen}
              </div>
              <hr />

              {
                !this.state.presenting
                ? <div>
                  <h3>Questions</h3>
                  <div className='ql-session-question-list'>
                    {
                      questionList.map((questionId) => {
                        const q = this.props.questions[questionId]
                        if (q._id === this.state.session.currentQuestion) {
                          return <div key={q._id} className='current-question-list-item'><QuestionListItem question={q} click={() => this.setCurrentQuestion(q._id)} /></div>
                        } else return <QuestionListItem key={q._id} question={q} click={() => this.setCurrentQuestion(q._id)} />
                      })
                    }
                  </div>
                  <hr />
                </div>
                : ''
              }

              <div className='btn-group btn-group-justified bottom-group _nav' role='group'>
                <a href='#' className='btn btn-default btn-sm' onClick={this.prevQuestion}><span className='glyphicon glyphicon-arrow-left' /> Previous</a>
                <a href='#' className='btn btn-default btn-sm' onClick={this.endSession}>End session</a>
                <a href='#' className='btn btn-default btn-sm' onClick={this.nextQuestion}>Next <span className='glyphicon glyphicon-arrow-right' /></a>
              </div>
            </div>
          </div>

          <div className={'ql-main-content' + (this.state.presenting ? ' presenting' : '')}>
            {
              !this.state.presenting
              ? <div>
                <h3>Results/Stats</h3>
                {<AnswerDistribution question={q} />}
                <div className='clear' />
                <h3 className='m-margin-top'>Question Preview</h3>
              </div>
              : ''
            }
            {questionPreview}
          </div>

        </div>
      </div>)
  }

}

export const RunSession = createContainer((props) => {
  const handle = Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inSession', props.sessionId) &&
    Meteor.subscribe('questions.library')

  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

  return {
    questions: _.indexBy(questionsInSession, '_id'),
    questionPool: Questions.find({ sessionId: {$exists: false} }).fetch(),
    session: session,
    loading: !handle.ready()
  }
}, _RunSession)

