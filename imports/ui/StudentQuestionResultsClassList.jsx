// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentQuestionResultsClassList.jsx: List displaying student session results

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { WysiwygHelper } from '../wysiwyg-helpers'
// import { QuestionDisplay } from './QuestionDisplay'
import { QuestionWithResponseArray } from './QuestionWithResponseArray'

import { QUESTION_TYPE } from '../configs'

import _ from 'underscore'

import { Responses } from '../api/responses'

export class _StudentQuestionResultsClassList extends Component {
  render () {
    return (<div className='ql-student-results-list'>
        <QuestionWithResponseArray style={{float: 'right'}} question={this.props.question} responses={this.props.responses} />
    </div>)
  } //  end render

}

export const StudentQuestionResultsClassList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)

  const responses = Responses.find({ questionId: props.question._id, studentUserId: Meteor.userId() },
                                   {sort: {attempt: 1}}).fetch()
  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _StudentQuestionResultsClassList)

StudentQuestionResultsClassList.propTypes = {
  question: PropTypes.object.isRequired
}
