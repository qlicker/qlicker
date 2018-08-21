import React, { Component } from 'react'

import _ from 'underscore'

import { createContainer } from 'meteor/react-meteor-data'
import DragSortableList from 'react-drag-sortable'

import { QuestionListItem } from './QuestionListItem'

import { Questions } from '../api/questions'

class _QuestionDragSortList extends Component {

  constructor (props) {
    super(props)

    this.removeQuestion = this.removeQuestion.bind(this)
    this.duplicateQuestion = this.duplicateQuestion.bind(this)
    this.addToLibrary = this.addToLibrary.bind(this)
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
    this.props.cursorMoveWorkaround()
  }

  /**
   * duplicateQuestion(MongoId (string): questionId)
   * creates a copy of the question and attached the new copy to the same session
   */
  duplicateQuestion (questionId) {
    Meteor.call('questions.copyToSession', this.sessionId, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Duplicate Added')
    })
    this.props.cursorMoveWorkaround()
  }

  /**
   * addToLibrary(MongoId (string): questionId)
   * adds the question to the library
   */
  addToLibrary (questionId) {
    Meteor.call('questions.copyToLibrary', questionId, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Copied to Library')
    })
  }

  render () {

    let questionList = this.props.session.questions || []
    console.log(this.props.courseId)
    const qlItems = []
    questionList.forEach((questionId) => {
      const q = this.props.questions[questionId]
      qlItems.push({
        content: <QuestionListItem
          courseId={this.props.courseId}
          click={this.props.cursorMoveWorkaround}
          question={q}
          session={this.props.session}
          controlsTriggered={this.props.cursorMoveWorkaround}
          controls={[
            { label: 'Remove', click: () => this.removeQuestion(questionId) },
            { label: 'Duplicate', click: () => this.duplicateQuestion(questionId) },
            { label: 'Add to library', click: () => this.addToLibrary(questionId) }
          ]} />,
        id: questionId
      })
    })
  
    return( 
      <div>
        <DragSortableList items={qlItems} onSort={this.props.onSortQuestions} />
      </div>
    )
  }
}


export const QuestionDragSortList = createContainer((props) => {

  const handle = Meteor.subscribe('questions.inSession', props.session._id)
  const questionsInSession = Questions.find().fetch()
  const courseId = props.session.courseId
  console.log(courseId)
  console.log(questionsInSession)
  return {
    loading: !handle.ready(),
    courseId: courseId,
    questions: _.indexBy(questionsInSession, '_id'),
    onSortQuestions: props.onSortQuestions,
    cursorMoveWorkaround: props.cursorMoveWorkaround
  }

}, _QuestionDragSortList)