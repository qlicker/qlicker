// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../api/questions'
import { Responses, responseDistribution } from '../api/responses'

import { AnswerDistribution } from './AnswerDistribution'
import { QuestionResultsClassList } from './QuestionResultsClassList'
import { QuestionResultsListItem } from './QuestionResultsListItem'
import { QuestionDisplay } from './QuestionDisplay'
import { ShortAnswerList } from './ShortAnswerList'

import { SessionResultsTable } from './SessionResultsTable'

import { QUESTION_TYPE } from '../configs'

export class _SessionResults extends Component {

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const total = this.props.session.joined ? this.props.session.joined.length : 0
    return (
      <div>
         Number of students in session: { total }
        <SessionResultsTable session={this.props.session} />

        {
        this.props.session.questions.map(qId => {
          const q = this.props.questions[qId]
          return (<div key={'questionResult_' + qId}>
            <a role='button' data-toggle='collapse' href={'#collapse_' + qId} aria-expanded='false' aria-controls={'collapse_' + qId} style={{ textDecoration: 'none' }}>
              <QuestionResultsListItem question={q} session={this.props.session} />
            </a>
            <div className='collapse' id={'collapse_' + qId}>
              <div className='row'>
                <div className='col-sm-6'>
                  <QuestionDisplay style={{float: 'right'}} question={q} prof readonly forReview />
                </div>

                <div className='col-sm-6'>
                  {
                    q && q.type !== QUESTION_TYPE.SA // option based questions
                    ? <AnswerDistribution question={q} title='Responses' responseStats={this.props.responseStatsByQuestion[qId]} /> : ''
                  }
                  {
                    q && q.type === QUESTION_TYPE.SA // short answer
                    ? <div> <ShortAnswerList question={q} /> </div> : ''
                  }
                </div>
              </div>
              <a role='button' data-toggle='collapse' href={'#detailsCollapse_' + qId} aria-expanded='false' aria-controls={'collapse_' + qId} style={{ textDecoration: 'none' }}>
                Toggle list of responses
              </a>
              <div className='collapse' id={'detailsCollapse_' + qId}>
                <QuestionResultsClassList question={q} session={this.props.session} />
              </div>
            </div>
          </div>)
        })
      }
      </div>)
  } //  end render

}

export const SessionResults = createContainer((props) => {
  const handle = Meteor.subscribe('questions.inSession', props.session._id) &&
                 Meteor.subscribe('responses.forSession', props.session._id)

  const questionsInSession = Questions.find({ _id: { $in: props.session.questions } }).fetch()
  const questions = _.indexBy(questionsInSession, '_id')

  const allResponses = Responses.find({questionId: { $in: props.session.questions }}).fetch()
  const responsesByQuestion = _(allResponses).groupBy('questionId')
  let responseStatsByQuestion = []
  questionsInSession.forEach((question) => {
    responseStatsByQuestion[question._id] = responseDistribution(responsesByQuestion[question._id], question)
  })

  return {
    questions: questions,
    responseStatsByQuestion: responseStatsByQuestion,
    loading: !handle.ready()
  }
}, _SessionResults)

SessionResults.propTypes = {
  session: PropTypes.object.isRequired
}
