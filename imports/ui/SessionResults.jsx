// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../api/questions'
import { AnswerDistribution } from './AnswerDistribution'
import { QuestionResultsClassList } from './QuestionResultsClassList'
import { QuestionResultsListItem } from './QuestionResultsListItem'
import { ShortAnswerList } from './ShortAnswerList'

import { QUESTION_TYPE } from '../configs'

export class _SessionResults extends Component {

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const total = this.props.session.joined ? this.props.session.joined.length : 0
    return (<div>
      Number of students in session: { total }
      {
        this.props.session.questions.map(qId => {
          const q = this.props.questions[qId]
          return (<div>
            <a role='button' data-toggle='collapse' href={'#collapse_' + qId} aria-expanded='false' aria-controls={'collapse_' + qId}>
              <QuestionResultsListItem question={q} session={this.props.session} />
            </a>
            <div className='collapse' id={'collapse_' + qId}>
              <div className='row'>
                <div className='col-md-5'><QuestionResultsClassList question={q} session={this.props.session} /></div>
                <div className='col-md-7'>
                  {
                    q && q.type !== QUESTION_TYPE.SA // option based questions
                    ? <div><AnswerDistribution question={q} title='Responses' /><div className='clear' /></div> : ''
                  }
                  {
                    q && q.type === QUESTION_TYPE.SA // short answer
                    ? <ShortAnswerList question={q} /> : ''
                  }
                </div>
              </div>
            </div>
          </div>)
        })
      }
    </div>)
  } //  end render

}

export const SessionResults = createContainer((props) => {
  const handle = Meteor.subscribe('questions.inSession', props.session._id)
  const questions = Questions.find({ sessionId: props.session._id }).fetch()

  return {
    questions: _(questions).indexBy('_id'),
    loading: !handle.ready()
  }
}, _SessionResults)

SessionResults.propTypes = {
  session: PropTypes.object.isRequired
}

