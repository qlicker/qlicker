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

import { AnswerDistribution } from './AnswerDistribution'

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
      <div className='response-card-content'>
        <QuestionDisplay question={this.props.question} prof readonly forReview />
        {
          q && q.type !== 2 // option based questions
          ? <div className='response-card-item'>
              <AnswerDistribution question={q} title='Responses' responseStats={this.props.responseDist} />
            </div>
          : ''
        }
        { 
          this.props.responses.map((response) => {
            return(
              <div key={response._id}>{response._id}</div>
            )
          })
        }
      </div>
  )
  }
}

export const ResponseList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forSession', props.session._id) &&
                 Meteor.subscribe('grades.forSession', props.session._id)
  
  const responses = Responses.find({ questionId: props.question._id }).fetch()
  
  const allResponses = Responses.find({questionId: { $in: props.session.questions }}).fetch()
  const responsesByQuestion = _(allResponses).groupBy('questionId')

  responseDist = responseDistribution(responsesByQuestion[props.question._id], props.question)

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