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
      this.state = { unsavedChanges: {} }

      this.saveAll = this.saveAll.bind(this)
      this.updateFeedback = this.updateFeedback.bind(this)
      this.updatePoints = this.updatePoints.bind(this)
      this.saveGrade = this.saveGrade.bind(this)
      this.cancelChange = this.cancelChange.bind(this)
      this.cancelAll = this.cancelAll.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.studentToView) {
      const node = ReactDOM.findDOMNode(this.refs[nextProps.studentToView._id])
      if (node) window.scrollTo({ top: node.offsetTop, behavior: 'smooth' })
    }
    if (nextProps.questionId !== this.props.questionId){
      this.setState( {unsavedChanges: {}}, () => {
        if(this.props.setUnsavedChanges) this.props.setUnsavedChanges(Object.keys(this.state.unsavedChanges).length > 0)
      })
    }

  }

  cancelAll () {
    this.setState( {unsavedChanges: {}}, () => {
      if(this.props.setUnsavedChanges) this.props.setUnsavedChanges(false)
    })
  }

  saveAll() {
    Object.keys(this.state.unsavedChanges).forEach( (studentId) => {
      this.saveGrade(studentId)
    })
  }

  updateFeedback (studentId, feedback) {
    let unsavedChanges = this.state.unsavedChanges
    const mark = this.props.markByStudentId[studentId]

    if (!unsavedChanges[studentId]) unsavedChanges[studentId] = {}

    if (feedback === mark.feedback && (!unsavedChanges[studentId]['points'] || unsavedChanges[studentId]['points'] === mark.points)){
      delete unsavedChanges[studentId]
    } else unsavedChanges[studentId]['feedback']=feedback

    this.setState( {unsavedChanges: unsavedChanges}, () => {
      if(this.props.setUnsavedChanges) this.props.setUnsavedChanges(Object.keys(this.state.unsavedChanges).length > 0)
    })
  }

  updatePoints (studentId, points) {
    let unsavedChanges = this.state.unsavedChanges
    const mark = this.props.markByStudentId[studentId]

    if (!unsavedChanges[studentId]) unsavedChanges[studentId] = {}

    if (points === mark.points && (!unsavedChanges[studentId]['feedback'] || unsavedChanges[studentId]['feedback'] === mark.feedback)){
      delete unsavedChanges[studentId]
    } else  unsavedChanges[studentId]['points']=points

    this.setState( {unsavedChanges: unsavedChanges}, () => {
      if(this.props.setUnsavedChanges) this.props.setUnsavedChanges(Object.keys(this.state.unsavedChanges).length > 0)
    })

  }

  saveGrade (studentId) {
    let mark = this.props.markByStudentId[studentId]
    const gradeId = this.props.gradeByStudenId[studentId]
    let unsavedChanges = this.state.unsavedChanges
    let studentChanges = unsavedChanges[studentId]

    if(!mark || !gradeId || !studentChanges) return

    const points = studentChanges['points'] ? studentChanges['points']  : mark.points

    if (points > mark.outOf ) {
      alertify.error('Warning: assigning bonus points')
    }
    if (points < 0) {
      alertify.error('Error: negative points')
      return
    }

    mark.feedback = studentChanges['feedback'] ? studentChanges['feedback'] : (mark.feedback ? mark.feedback : '')
    mark.points = points
    mark.needsGrading = false
    Meteor.call('grades.updateMark', gradeId, mark, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      const student = _(this.props.students).findWhere({ _id:studentId })
      alertify.success('Mark updated for '+student.profile.firstname+" "+student.profile.lastname)
      delete unsavedChanges[studentId]
      this.setState( {unsavedChanges: unsavedChanges}, () => {
        if(this.props.setUnsavedChanges) this.props.setUnsavedChanges(Object.keys(this.state.unsavedChanges).length > 0)
      })
    })
  }

  cancelChange(studentId) {
    let unsavedChanges = this.state.unsavedChanges
    delete unsavedChanges[studentId]
    this.setState( {unsavedChanges: unsavedChanges}, () => {
      if(this.props.setUnsavedChanges) this.props.setUnsavedChanges(Object.keys(this.state.unsavedChanges).length > 0)
    })
  }

  render () {

    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const students = this.props.students
    let index = 0
    const hasUnsaved = Object.keys(this.state.unsavedChanges).length > 0
    return (
      <div className='ql-response-list'>
        <div className='ql-response-table-headers'>
          <div className='header-name'>Student Name</div>
          <div className='header-response'>Response</div>
          <div className='header-mark'>Grade</div>
          <div className='header-feedback'>Feedback</div>
          <div className='header-button'>
            {hasUnsaved ?
              <div className='btn-group-vertical'>
                <button className='btn btn-secondary' onClick={this.saveAll}> Save all </button>
                <button className='btn btn-secondary' onClick={this.cancelAll}> Cancel all </button>
              </div>
              : ''
            }
          </div>
        </div>
        <div className='ql-response-display-list'>
          {
            students.map((student) => {
              const stuId = student._id
              const mark = this.props.markByStudentId[stuId]
              const gradeId = this.props.gradeByStudenId[stuId]
              const responses = this.props.responsesByStudentId[stuId]
              const studentName = student.profile.lastname + ', ' + student.profile.firstname
              let className = 'ql-response-display-container'
              if (index %2 !== 0) className += ' highlight'
              const points = this.state.unsavedChanges[stuId] && this.state.unsavedChanges[stuId]['points'] ?
                             this.state.unsavedChanges[stuId]['points'] : mark.points
              const feedback = this.state.unsavedChanges[stuId] && this.state.unsavedChanges[stuId]['feedback'] ?
                            this.state.unsavedChanges[stuId]['feedback'] : (mark.feedback ? mark.feedback : '')

              const studentHasChanges = hasUnsaved && this.state.unsavedChanges[stuId]

              index += 1
              return(
                <div className={className} key={student._id} ref={student._id}>
                  <ResponseDisplay
                    studentName={studentName}
                    studentId={student._id}
                    responses={responses}
                    mark={mark}
                    questionType={this.props.qtype}
                    points = {points}
                    feedback = {feedback}
                    saveGrade = {studentHasChanges ? this.saveGrade : undefined }
                    cancelChange =  {studentHasChanges ? this.cancelChange : undefined }
                    updateFeedback = {this.updateFeedback}
                    updatePoints = {this.updatePoints}
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
  const handle = Meteor.subscribe('responses.forSession', props.sessionId) &&
                 Meteor.subscribe('grades.forSession', props.sessionId)

  const questionId = props.questionId ? props.questionId : ''
  const responses = Responses.find({ questionId: questionId }).fetch()

  const studentIds = _(props.students).pluck('_id')
  //Include session ID in case this component lives in a component where Responses is also
  //subscribed to
  const grades = Grades.find({ userId:{$in:studentIds}, sessionId:props.sessionId }).fetch()

  let responsesByStudentId = {}
  let markByStudentId = {}
  let gradeByStudenId = {}

  for (let i=0; i < props.students.length ; i++){
    let stu = props.students[i]
    responsesByStudentId[stu._id]= _(_(responses).where({ studentUserId:stu._id }))
                                                .sortBy( (r)=>{return r.attempt})
    let grade = _(grades).findWhere({userId:stu._id})
    gradeByStudenId[stu._id] = grade ? grade._id : null
    let mark = grade ? _(grade.marks).findWhere({ questionId:props.questionId }) : null
    markByStudentId[stu._id] = mark
  }
  //console.log(responsesByStudentId)
  //console.log(markByStudentId)
  //console.log(gradeByStudenId)

  return {
    loading: !handle.ready(),
    responsesByStudentId: responsesByStudentId,
    markByStudentId: markByStudentId,
    gradeByStudenId: gradeByStudenId,
  }
}, _ResponseList)

ResponseList.propTypes = {
  session: PropTypes.object,
  question: PropTypes.object,
  students: PropTypes.array,
  studentToView: PropTypes.object,
  grades: PropTypes.array,
  setUnsavedChanges: PropTypes.func
}
