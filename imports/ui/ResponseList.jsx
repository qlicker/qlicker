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
      <div>
        <h3 className='response-categories'>
          <span className='category' style={{'width':'20%'}}>Student Name</span>
          <span className='category' style={{'width':'20%'}}>Response</span>
          <span className='category' style={{'width':'20%'}}>Grade</span>
          <span className='category' style={{'width':'30%'}}>Feedback</span>
        </h3>
        { 
          students.map((student) => {
            const mark = this.props.marks[index]
            const response = responses[index]
            const studentName = student.profile.lastname + ', ' + student.profile.firstname
            index += 1
            return(
              <div key={student._id} ref={student._id}>
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