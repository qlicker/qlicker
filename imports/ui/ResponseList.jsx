/* global confirm  */
// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ResponseList.jsx: page for displaying a list of responses to a question

import React, { PropTypes, Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import _ from 'underscore'

import { Responses, responseDistribution } from '../api/responses'
import { Grades } from '../api/grades'

import { QuestionDisplay } from './QuestionDisplay'

class _ResponseList extends Component {

  constructor(props) {
      super(props)

      this.state = {
          selectedStudent: null
      }
  }

  render() {

    const q = this.props.question
    return (
      <div>
        <QuestionDisplay question={this.props.question} prof readonly forReview />
        {
          q && q.type !== QUESTION_TYPE.SA // option based questions
          ? <AnswerDistribution question={q} title='Responses' responseStats={this.props.responseDist} /> : ''
        }
        { 
          this.props.responses.map((response) => {
            return(
              <div>{response._id}</div>
            )
          })
        }
      </div>
  )
  }
}

export const ResponseList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forSession', props.sessionId) &&
                 Meteor.subscribe('grades.forSession', props.sessionId)
  
  const responses = Responses.find({ questionId: props.question._id }).fetch()
  
  const allResponses = Responses.find({questionId: { $in: props.session.questions }}).fetch()
  const responsesByQuestion = _(allResponses).groupBy('questionId')

  responseDist = responseDistribution(responsesByQuestion[question._id], question)

  return {
    students: props.students,
    question: props.question,
    responses: responses,
    responseDist: responseDist
  }               
}, _ResponseList)

ResponseList.propTypes = {
  question: PropTypes.object,
  students: PropTypes.array
}