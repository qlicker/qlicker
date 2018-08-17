/* global confirm  */
// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ResponseList.jsx: page for displaying a list of responses to a question

import React, { PropTypes, Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import ReactDOM from 'react-dom'

import _ from 'underscore'

import { Responses, responseDistribution } from '../api/responses'
import { Grades } from '../api/grades'

import { ResponseDisplay } from './ResponseDisplay'


class _ResponseList extends Component {

  constructor(props) {
      super(props)

      this.submitGrade = this.submitGrade.bind(this)
  }

  submitGrade (points, outOf, feedback, gradeId) {
    mark = {
      points: Number(points),
      outOf: Number(outOf),
      feedback: feedback,
      questionId: this.props.question._id,
      gradeId: gradeId
    }

    Meteor.call('grades.updateMark', mark, (err) => {
      if (err) alertify.error(err)
      else alertify.success('Updated Mark')
    })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.studentToView) {
      const node = ReactDOM.findDOMNode(this.refs[nextProps.studentToView._id])
      window.scrollTo(0, node.offsetTop)
    }
  }
  
  render () {
    
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    
    const q = this.props.question
    const responses = this.props.responses
    const students = this.props.students
    let index = 0

    return (
      <div className='response-list'>
      { 
        responses.map((response) => {
          const mark = this.props.marks[index]
          const student = students[index]
          const studentName = student.profile.lastname + ', ' + student.profile.firstname
          index += 1
          return(
            <div key={response._id} ref={student._id}>
              <ResponseDisplay
                studentName={studentName} 
                response={response} 
                mark={mark} 
                questionType={q.type}
                submitGrade={this.submitGrade}/>
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
  
  const questionId = props.question ? props.question._id : ''

  const responses = Responses.find({ questionId: questionId }).fetch()

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
    loading: !handle.ready(),
    students: props.students,
    studentToView: props.studentToView,
    question: props.question,
    responses: responses,
    marks: marks
  }               
}, _ResponseList)

ResponseList.propTypes = {
  session: PropTypes.object,
  question: PropTypes.object,
  students: PropTypes.array,
  studentToView: PropTypes.object,
  grades: PropTypes.array
}