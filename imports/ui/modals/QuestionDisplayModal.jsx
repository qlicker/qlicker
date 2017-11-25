// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// GradeViewModal

import React, { PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { ControlledForm } from '../ControlledForm'
import { QuestionDisplay } from '../QuestionDisplay'

/**
 * modal dialog to display a question
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
 //TODO: probably should not inherit from ControlledForm...
export const QuestionDisplayModal extends ControlledForm {

  constructor (props) {
    super(props)
  }

  render () {
    if (!this.props.question) return <div className='ql-subs-loading'>Loading</div>
    return ( grade ?
       <div className='ql-modal-container' onClick={this.props.done} >
          <div className='ql-modal ql-card' onClick={this.preventPropagation}>
            <div className='ql-modal-header ql-header-bar' />
            <div className='ql-card-content'>
              <div className='row'>
                <QuestionDisplay question={this.props.question} readonly forReview response={this.props.response ? this.prop.respsone: undefined}>
                <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                  <a className='btn btn-default' onClick={this.props.done}>Close</a>
                </div>


              </div>
             </div>
            </div>
        </div>
      : 'Loading')
  } //  end render

}

QuestionDisplayModal.propTypes = {
  question: PropTypes.object,
  response: PropTypes.object
}
