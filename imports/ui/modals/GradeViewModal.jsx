// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// GradeViewModal

import React, { PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { GradeView } from '../GradeView'
import { ControlledForm } from '../ControlledForm'

/**
 * modal dialog to prompt for new email addresss
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class GradeViewModal extends ControlledForm{

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const grade = this.props.grade
    const student = this.props.student

    let questionCount = 0
    return ( grade ?
       <div className='ql-modal-container'  >
          <div className='ql-modal ql-card' >
            <div className='ql-modal-header ql-header-bar'><h3>{grade.name} {student.profile.lastname}, {student.profile.firstname}</h3> </div>
            <div className='ql-card-content'>
              <div className='row'>
                <GradeView grade={grade} />
                <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                  <a className='btn btn-default' onClick={this.props.done}>Close</a>
                </div>
              </div>
             </div>
            </div>
        </div>
      : 'Loading')
  } //  end render

} // end GradeViewModal


GradeViewModal.propTypes = {
  done: PropTypes.func,
  grade: PropTypes.object,
  student: PropTypes.object
}
