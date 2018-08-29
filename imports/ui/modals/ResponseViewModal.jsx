// QLICKER
// Author: Hayden Pfeiffer (hayden.pfeiffer@queensu.ca)
//
// ResponseViewModal.jsx: modal for viewing a full response to a question

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'

import { WysiwygHelper } from '../../wysiwyg-helpers'

export class ResponseViewModal extends ControlledForm {

  constructor (props) {
    super(props)
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.setState({})
    this.props.done()
  }
  
  render () {
    
    return (
      <div className='ql-modal-container' >
        <div className='row'>
          <div className='col-md-3' />
          <div className='col-md-6'>
            <div className='ql-profile-card  ql-card'>
              <div className='profile-header ql-header-bar'>
                <h1>View Response</h1>
              </div>
              <div className='ql-card-content'>
                {WysiwygHelper.htmlDiv(this.props.response.answerWysiwyg)}
                <br />
                <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                  <a className='btn btn-default' onClick={this.done}>Close</a>
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-3' />
        </div>
      </div>
    )
  } //  end render

} // end ResponseViewModal

ResponseViewModal.propTypes = {
  done: PropTypes.func,
  response: PropTypes.object
}
