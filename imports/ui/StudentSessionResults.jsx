// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentSessionResults.jsx: Component for student-specific session review

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../api/questions'
import { Responses } from '../api/responses'

import { StudentQuestionResultsClassList } from './StudentQuestionResultsClassList'
import { StudentQuestionResultsListItem } from './StudentQuestionResultsListItem'

export class _StudentSessionResults extends Component {

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    return (<div>
      {
        this.props.session.questions.map((qId, index) => {
          const q = this.props.questions[qId]
          return (<div key={'qdiv_' + qId}>
            <a role='button' data-toggle='collapse' href={'#collapse_' + qId} aria-expanded='false' aria-controls={'collapse_' + qId} style={{ textDecoration: 'none' }}>
              <StudentQuestionResultsListItem question={q} session={this.props.session} index={index} />
            </a>
            <div className='collapse' id={'collapse_' + qId}>
              <div className='row'>
                <StudentQuestionResultsClassList question={q} />
              </div>
            </div>
          </div>)
        })
      }
    </div>)
  } //  end render

}

export const StudentSessionResults = createContainer((props) => {
  const handle = Meteor.subscribe('questions.forReview', props.session._id)
  Meteor.subscribe('responses.forSession', props.session._id)

  const questions = Questions.find({ _id: { $in: props.session.questions || [] } }).fetch()

  questions.map((questions) => {
    questions.studentResponses = Responses.find({ studentUserId: props.studentId, questionId: questions._id }).fetch()
  })

  return {
    questions: _(questions).indexBy('_id'),
    loading: !handle.ready()
  }
}, _StudentSessionResults)

StudentSessionResults.propTypes = {
  session: PropTypes.object.isRequired
}
