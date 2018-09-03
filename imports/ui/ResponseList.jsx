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
      window.scrollTo({ top: node.offsetTop, behavior: 'smooth' })
    }
  }

  render () {

    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const q = this.props.question
    const responses = this.props.responses
    const students = this.props.students
    let index = 0

    return (
      <div className='ql-response-list'>
        <div className='ql-response-table-headers'>
          <div className='header-name'>Student Name</div>
          <div className='header-response'>Response</div>
          <div className='header-mark'>Grade</div>
          <div className='header-feedback'>Feedback</div>
          <div className='header-button'></div>
        </div>
        <div className='ql-response-display-list'>
          {
            students.map((student) => {
              const mark = this.props.marks[index] || null
              const response = responses[index] || null
              const studentName = student.profile.lastname + ', ' + student.profile.firstname
              index += 1
              return(
                <div className='ql-response-display-container' key={student._id} ref={student._id}>
                  <ResponseDisplay
                    studentName={studentName}
                    response={response}
                    mark={mark}
                    questionType={q.type}
                    //submitGrade={this.submitGrade}
                  />
                </div>
              )
            })
          }
        </div>
      </div>
    )
  }
}

export const ResponseList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forSession', props.session._id) &&
                 Meteor.subscribe('grades.forSession', props.session._id)

  const questionId = props.question ? props.question._id : ''

  const responses = Responses.find({ questionId: questionId }).fetch()

  //New
  const studentIds = _(props.students).pluck('_id')
  const grades = Grades.find({ userId:{$in:studentIds},
                               questionId: props.questionId,
                               sessionId: props.sessionId}).fetch()

  let responsesByStudent = {}
  for (let i=0; i < props.students.length ; i++){
    let stu = props.students[i]
    responsesByStudent[stu._id]=_(responses).where({studentUserId:stu._id})
  }
  console.log(responsesByStudent)

 //end new

 
  let marks = []

  props.grades.forEach(grade => {
    grade.marks.forEach(mark => {
      mark.gradeId = grade._id
      if (props.question && mark.questionId === props.question._id) {
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
