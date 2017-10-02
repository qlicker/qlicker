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
import { QuestionDisplay } from './QuestionDisplay'
import { ShortAnswerList } from './ShortAnswerList'
import { SessionResultsDownloader } from './SessionResultsDownloader'

import { QUESTION_TYPE } from '../configs'

export class _SessionResults extends Component {

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const total = this.props.session.joined ? this.props.session.joined.length : 0
    return (<div>
      <div className='row'>
        <div className='col-md-3'>Number of students in session: { total }</div>
        <div className='col-md-2 pull-right'>
          <SessionResultsDownloader session={this.props.session} />
        </div>
      </div>
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
                  <QuestionDisplay style={{float: 'right'}} question={q} readonly noStats forReview />
                </div>

                <div className='col-sm-6'>
                  {
                    q && q.type !== QUESTION_TYPE.SA // option based questions
                    ? <AnswerDistribution question={q} title='Responses' /> : ''
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
