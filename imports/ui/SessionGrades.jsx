// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../api/questions'
import { AnswerDistribution } from './AnswerDistribution'
import { StudentResultsList } from './StudentResultsList'

export class _SessionGrades extends Component {

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    return (<div>
      {
        this.props.session.questions.map(qId => {
          const q = this.props.questions[qId]
          return (<div>
            <h3>{q.plainText}</h3>
            <AnswerDistribution question={q} />
            <StudentResultsList question={q} />
          </div>)
        })
      }
    </div>)
  } //  end render

}

export const SessionGrades = createContainer((props) => {
  const handle = Meteor.subscribe('questions.inSession', props.session._id)
  const questions = Questions.find({ sessionId: props.session._id }).fetch()

  return {
    questions: _(questions).indexBy('_id'),
    loading: !handle.ready()
  }
}, _SessionGrades)

SessionGrades.propTypes = {
  session: PropTypes.object.isRequired
}

