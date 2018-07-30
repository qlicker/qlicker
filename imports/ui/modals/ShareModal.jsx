// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ExportModal.jsx: modal for exporting a question to a user outside of the current course

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'

import '../../api/users.js'

export class ShareModal extends ControlledForm {

  constructor (props) {
    super(props)

    this.state = { recipientEmail: '' }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.submitToSelf = this.submitToSelf.bind(this)
  }

  handleSubmit (e) {
    super.handleSubmit(e)
    Meteor.call('users.getUserByEmail', this.state.recipientEmail, (err, result) => {
      if (err || !result) alertify.error('Cannot find user')
      else {
        this.props.submit(result)
        this.props.done()
      }
    })
  }
  
  submitToSelf (e) {
    super.handleSubmit(e)
    const user = Meteor.user()
    this.props.submit(user, user.hasGreaterRole('professor'))
    this.props.done()
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
              <a className='btn btn-default' onClick={this.submitToSelf}>Send Question to Self</a>
                <input className='btn btn-default' type='submit' id='submit' />
              </div>
            </form>
          </div>
        </div>
    )
  }
}

ShareModal.proptypes = {
  questionId: PropTypes.string.isRequired,
  done: PropTypes.func.isRequired,
  submit: PropTypes.func.isRequired
}