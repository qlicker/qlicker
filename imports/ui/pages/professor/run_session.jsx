/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import $ from 'jquery'

import { createContainer } from 'meteor/react-meteor-data'
import DragSortableList from 'react-drag-sortable'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'

import { Sessions } from '../../../api/sessions'
import { Questions } from '../../../api/questions'

import { QuestionListItem } from '../../QuestionListItem'
import { QuestionDisplay } from '../../QuestionDisplay'

class _RunSession extends Component {

  constructor (props) {
    super(props)

    this.state = { editing: false, session: _.extend({}, this.props.session) }

    this.sessionId = this.props.sessionId

    this.removeQuestion = this.removeQuestion.bind(this)
    this.toggleStats = this.toggleStats.bind(this)
    this.onSortQuestions = this.onSortQuestions.bind(this)
    this.setCurrentQuestion = this.setCurrentQuestion.bind(this)
    this.prevQuestion = this.prevQuestion.bind(this)
    this.nextQuestion = this.nextQuestion.bind(this)
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

  componentWillReceiveProps (nextProps) {
    if (nextProps && nextProps.session) this.setState({ session: nextProps.session })
  }

  render () {
    const current = this.state.session.currentQuestion
    if (this.props.loading || !current) return <div>Loading</div>

    let questionList = this.state.session.questions || []
    const qlItems = []
    questionList.forEach((questionId) => {
      const q = this.props.questions[questionId]
      qlItems.push({
        content: <QuestionListItem question={q} click={this.setCurrentQuestion} />,
        id: questionId
      })
    })

    const q = this.props.questions[current]
    const answerDistribution = q.getDistribution()

    return (
      <div className='container-fluid ql-manage-session'>

        <div className='row'>
          <div className='col-md-4 col-sm-4 sidebar-container'>
            <div className='ql-session-sidebar'>
              <h2>Session: { this.state.session.name }</h2>

              <hr />
              <h3>Questions</h3>
              <ol className='ql-session-question-list'>
                {/* {<DragSortableList items={qlItems} onSort={this.onSortQuestions} />}*/}
                {
                  questionList.map((questionId) => {
                    const q = this.props.questions[questionId]
                    if (q._id === this.state.session.currentQuestion) {
                      return <div className='current-question-list-item'><QuestionListItem question={q} click={this.setCurrentQuestion} /></div>
                    } else return <QuestionListItem question={q} click={this.setCurrentQuestion} />
                  })
                }
              </ol>

            </div>
          </div>
          <div className='col-md-8 col-sm-8' >
            <h3>Current Question: {q.plainText}</h3>
            <button className='btn btn-default'>Show/Hide Question</button>
            <button className='btn btn-default'>Allow/Deny Answers</button>
            <button className='btn btn-default'>Presentation Mode</button>
            <button className='btn btn-default' onClick={() => { window.open('/session/present/' + this.state.session._id, 'Qlicker', 'height=768,width=1024') }}>Seperate Question Display</button>
            <hr />
            <h3>Results/Stats</h3>
            <button className='btn btn-default' onClick={() => this.toggleStats(q._id)}>Show/Hide Stats</button>

            <BarChart
              width={500} height={200} data={answerDistribution}
              margin={{top: 5, right: 0, left: -20, bottom: 5}}>
              <XAxis dataKey='answer' />
              <YAxis allowDecimals={false} />
              <Bar dataKey='count' fill='#2FB0E8' label isAnimationActive={false} />
            </BarChart>

            <hr />
            <h3>Question Preview</h3>
            <div className='ql-question-preview'>{ q ? <QuestionDisplay question={q} readonly /> : '' }</div>
            <br />
            <button className='btn btn-default' onClick={this.prevQuestion}>Previous Question</button>
            <button className='btn btn-default' onClick={this.nextQuestion}>Next Question</button>
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

