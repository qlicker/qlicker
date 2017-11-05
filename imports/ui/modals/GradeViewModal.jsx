// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// GradeViewModal

import React, { PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { ControlledForm } from '../ControlledForm'

/**
 * modal dialog to prompt for new email addresss
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class _GradeViewModal extends ControlledForm {

  constructor (props) {
    super(props)

  }


  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const grade = this.props.grade
    const student = this.props.student
    return ( grade ?
       <div className='ql-modal-container' onClick={this.props.done} >
          <div className='ql-modal ql-card' onClick={this.preventPropagation}>
            <div className='ql-modal-header ql-header-bar'><h3>{grade.name} {student.profile.lastname}, {student.profile.firstname}</h3> </div>
            <div className='ql-card-content'>
              <div className='row'>
                <div className='col-md-4' />
                <div className='col-md-4'>
                  Grade value: {grade.value} <br />
                  Participation: {grade.participation} <br />
                  Questions answered total: {grade.numAnsweredTotal}<br />
                  Questions total: {grade.numQuestionsTotal} <br />
                  Questions worth points answered: {grade.numAnswered}  <br />
                  Questions worth points: {grade.numQuestions}  <br />
                </div>
                <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                  <a className='btn btn-default' onClick={this.props.done}>Close</a>
                </div>
                <div className='col-md-4' />
              </div>
             </div>
            </div>
        </div>
      : 'Loading')
  } //  end render

} // end profileViewModal

// meteor reactive data container
export const GradeViewModal = createContainer((props) => {
  const courseId = props.grade.courseId
  const grade = props.grade
  const handle = Meteor.subscribe('users.myStudents', {cId: props.courseId})

  const student = Meteor.users.findOne({ _id:grade.userId })

  return {
    loading: !handle.ready(),
    grade: grade,
    student: student
  }
}, _GradeViewModal)

GradeViewModal.propTypes = {
  done: PropTypes.func,
  grade: PropTypes.object
}
