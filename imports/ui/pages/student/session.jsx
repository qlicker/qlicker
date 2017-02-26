/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { CreateQuestionModal } from '../../modals/CreateQuestionModal'

import { Questions } from '../../../api/questions'
import { Sessions } from '../../../api/sessions'
import { SessionListItem } from '../../SessionListItem'

class _Session extends Component {

  constructor (props) {
    super(props)

    this.state = { submittingQuestion: false }
  }


  render () {
    const current = this.props.session.currentQuestion
    if (current) {
      const q = this.props.questions[current]
      console.log(q, current, this.props.questions)
      return (
        <div className='container ql-session-display'>
          { JSON.stringify(q) }
        </div>)
    }
    return (
      <div className='container ql-session-display'>
        No question selected
      </div>)
  }

}

export const Session = createContainer((props) => {
  const handle = Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inSession', props.sessionId)

  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
  let student = Meteor.users.find({ _id: Meteor.userId() }).fetch()[0]
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

  return {
    questions: _.indexBy(questionsInSession, '_id'),
    student: student,
    session: session,
    loading: !handle.ready()
  }
}, _Session)

