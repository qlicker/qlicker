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

    //const q = this.props.question
    //const responses = this.props.responses
    const students = this.props.students
  //  let index = 0

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
              const stuId = student._id
              //const mark = this.props.marks[index] || null
              //const response = responses[index] || null
              const mark = this.props.markByStudentId[stuId]
              const gradeId = this.props.gradeByStudenId[stuId]
              const responses = this.props.responsesByStudentId[stuId]
              let response = responses ? responses[responses.length-1] : null

              const studentName = student.profile.lastname + ', ' + student.profile.firstname
              //index += 1
              return(
                <div className='ql-response-display-container' key={student._id} ref={student._id}>
                  <ResponseDisplay
                    studentName={studentName}
                    response={response}
                    mark={mark}
                    gradeId={gradeId}
                    questionType={this.props.qtype}
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
  const grades = Grades.find({userId:{$in:studentIds}}).fetch()

  let responsesByStudentId = {}
  let markByStudentId = {}
  let gradeByStudenId = {}
  for (let i=0; i < props.students.length ; i++){
    let stu = props.students[i]
    responsesByStudentId[stu._id]=_(_(responses).where({ studentUserId:stu._id }))
                                                .sortBy( (r)=>{return r.attempt})
    let grade = _(grades).findWhere({userId:stu._id})
    gradeByStudenId[stu._id] = grade ? grade._id : null
    let mark = grade ? _(grade.marks).findWhere({ questionId:props.questionId }) : null
    markByStudentId[stu._id] = mark

  }
  //console.log(responsesByStudentId)
  //console.log(markByStudentId)
  //console.log(gradeByStudenId)

 //end new
/*

  let marks = []

  props.grades.forEach(grade => {
    grade.marks.forEach(mark => {
      mark.gradeId = grade._id
      if (props.question && mark.questionId === props.question._id) {
        marks.push(mark)
      }
    })
  })
*/

  return {
    loading: !handle.ready(),
    students: props.students,
    studentToView: props.studentToView,
    questionId: props.questionId,
    responsesByStudentId: responsesByStudentId,
    markByStudentId: markByStudentId,
    gradeByStudenId: gradeByStudenId,
    qtype: props.qtype
    //question: props.question,
    //responses: responses,
    //marks: marks
  }
}, _ResponseList)

ResponseList.propTypes = {
  session: PropTypes.object,
  question: PropTypes.object,
  students: PropTypes.array,
  studentToView: PropTypes.object,
  grades: PropTypes.array
}
