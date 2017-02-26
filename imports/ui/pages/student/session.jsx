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
import { QuestionDisplay } from '../../QuestionDisplay'

class _Session extends Component {

  constructor (props) {
    super(props)

    this.state = { submittingQuestion: false }
  }


  render () {
    const current = this.props.session.currentQuestion
    const q = current ? this.props.questions[current] : null

    return (
      <div className='container ql-session-display'>
        { q ? <QuestionDisplay question={q} /> : '' }
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

