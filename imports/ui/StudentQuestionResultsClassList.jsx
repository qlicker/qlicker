// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentQuestionResultsClassList.jsx: List displaying student session results

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { QuestionWithResponseArray } from './QuestionWithResponseArray'

import { Responses } from '../api/responses'
import { PracticeResponses } from '../api/practiceResponses'

export class _StudentQuestionResultsClassList extends Component {
  render () {
    return (
      <div className='ql-student-results-list container'>
        <div className='row'>
          <div className='col-md-8'>
            <div className='ql-result-question-container'>
              <QuestionWithResponseArray question={this.props.question} responses={this.props.responses} />
            </div>
          </div>
          <div className='col-md-4'>
            {this.props.mark
              ? <div className='ql-result-mark-container'>
                <div className='ql-result-mark'> Points: {this.props.mark.points}/{this.props.mark.outOf} </div>
                <div className='ql-result-feedback'>Feedback: {this.props.mark.feedback} </div>
              </div>
              : ''
            }
          </div>
        </div>
      </div>
    )
  } //  end render

}

export const StudentQuestionResultsClassList = createContainer((props) => {
  let handle, responses

  if (props.practiceSessionId) {
    handle = Meteor.subscribe('practiceResponses.forQuestion', props.question._id)
    responses = PracticeResponses.find({questionId: props.question._id, practiceSessionId: props.practiceSessionId}).fetch()
  } else {
    handle = Meteor.subscribe('responses.forQuestion', props.question._id)
    responses = Responses.find({ questionId: props.question._id, studentUserId: Meteor.userId() },
                                     {sort: {attempt: 1}}).fetch()
  }

  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _StudentQuestionResultsClassList)

StudentQuestionResultsClassList.propTypes = {
  question: PropTypes.object.isRequired,
  practiceSessionId: PropTypes.string,
  mark: PropTypes.object
}
