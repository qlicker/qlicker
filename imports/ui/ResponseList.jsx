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
import { ResponseDisplay } from './ResponseDisplay'

import { AnswerDistribution } from './AnswerDistribution'

class _ResponseList extends Component {

  constructor(props) {
      super(props)

      this.state = {
          selectedStudent: null
      }

      this.submitGrade = this.submitGrade.bind(this)
      this.submitFeedback = this.submitFeedback.bind(this)
  }

  submitGrade (points, outOf, gradeId) {
    mark = {
      points: points,
      outOf: outOf,
      questionId: this.props.question._id,
      gradeId: gradeId
    }

    Meteor.call('grades.updateMark', mark, (err) => {
      if (err) alertify.error(err.message)
      else alertify.success('Updated Mark')
    })
  }

  submitFeedback (feedback, responseId) {
    response = {
      _id: responseId,
      feedback: feedback
    }

    Meteor.call('responses.updateFeedback', response, (err) => {
      if(err) alertify.error(err.message)
      else alertify.success('Updated Feedback')
    })
  }

  render () {

    const q = this.props.question
    const responses = this.props.responses
    const students = this.props.students
    let index = 0
    
    return (
      <div>
        <QuestionDisplay question={q} prof readonly forReview />
        {
          q && q.type !== 2 // option based questions
          ? <div className='response-distribution'>
              <AnswerDistribution question={q} title='Responses' responseStats={this.props.responseDist} />
            </div>
          : ''
        }
        { 
          responses.map((response) => {
            const mark = this.props.marks[index]
            const studentName = students[index].profile.lastname + ', ' + students[index].profile.firstname
            index += 1
            return(
              <div key={response._id}>
                <ResponseDisplay
                  studentName={studentName} 
                  response={response} 
                  mark={mark} 
                  questionType={q.type}
                  submitGrade={this.submitGrade}
                  submitFeedback={this.submitFeedback}/>
              </div>
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

  let responseDist = responseDistribution(responsesByQuestion[props.question._id], props.question)
  
  let marks = []
 
  props.grades.forEach(grade => {
    grade.marks.forEach(mark => {
      mark.gradeId = grade._id
      if (mark.questionId === props.question._id) {
        marks.push(mark)
      }
    })
  })
  

  return {
    students: props.students,
    question: props.question,
    responses: responses,
    responseDist: responseDist,
    marks: marks
  }               
}, _ResponseList)

ResponseList.propTypes = {
  session: PropTypes.object,
  question: PropTypes.object,
  students: PropTypes.array,
  grades: PropTypes.array
}