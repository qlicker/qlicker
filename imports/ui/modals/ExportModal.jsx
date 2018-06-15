// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ExportModal.jsx: modal for exporting a question to a user outside of the current course

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'

import '../../api/users.js'

export class ExportModal extends ControlledForm {

  constructor (props) {
    super(props)

    this.state = { recipientEmail: '' }
  }

  handleSubmit (e) {
    super.handleSubmit(e)
    Meteor.call('users.getUserByEmail', this.state.recipientEmail, (err, result) => {
      if (err) alertify.error('Cannot find user')
      else {
        this.props.submit(result.user, result.approved, true)
        this.props.done()
      }
    })
  }
  
  render () {

    const setRecipient = (e) => this.setState({ recipientEmail: e.target.value })

    return(
        <div className='ql-modal-container'>
          <div className='ql-modal ql-modal-newemail ql-card' onClick={this.preventPropagation}>
            <div className='ql-modal-header ql-header-bar'><h3>Export This Question</h3></div>
            <form ref='newEmailForm' className='ql-card-content' onSubmit={this.handleSubmit}>

              <div className='text'>Enter a user's Qlicker account email address to give send them a copy of this question.</div>

              <label>Email:</label>
              <input type='email' className='form-control' value={this.state.recipientEmail} onChange={setRecipient} /><br />

              <div className='ql-buttongroup'>
              <a className='btn btn-default' onClick={this.props.done}>Cancel</a>
                <input className='btn btn-default' type='submit' id='submit' />
              </div>
            </form>
          </div>
        </div>
    )
  }
}

ExportModal.proptypes = {
  questionId: PropTypes.string.isRequired,
  done: PropTypes.func.isRequired,
  submit: PropTypes.func.isRequired
}