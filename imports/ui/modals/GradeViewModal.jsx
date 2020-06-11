// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// GradeViewModal

import React from 'react';
import PropTypes from 'prop-types';

import { GradeView } from '../GradeView'
import { ControlledForm } from '../ControlledForm'

/**
 * modal dialog to prompt for new email addresss
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class GradeViewModal extends ControlledForm {

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const gradeId = this.props.gradeId
    return ( gradeId
       ? <div className='ql-modal-container' >
          <div className='ql-modal ql-card' >
            <div className='ql-modal-header ql-header-bar'><h3>{this.props.gradeName} {this.props.studentName}</h3> </div>
            <div className='ql-card-content'>
              <div className='row'>
                <GradeView gradeId={this.props.gradeId} courseId={this.props.courseId} sessionId={this.props.sessionId} />
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
  gradeId: PropTypes.string,
  courseId: PropTypes.string,
  sessionId: PropTypes.string,
  gradeName: PropTypes.string,
  studentName: PropTypes.string
}
