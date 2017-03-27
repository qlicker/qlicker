// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ChangeEmailModal.jsx: popup dialog to prompt for new email addresss

import React from 'react'

import { ControlledForm } from '../ControlledForm'


export class ChangeEmailModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { newEmail: '' }
    this.newEmailOnChange = this.newEmailOnChange.bind(this)
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.newEmailForm.reset()
    this.setState({})
    this.props.done()
  }

  newEmailOnChange (e) {
    this.setState({ newEmail: e.target.value })
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for enroll form. Calls users.changeEmail
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    Meteor.call('users.changeEmail', this.state.newEmail, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Verification Email Sent')
        this.done()
      }
    })
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-newemail container' onClick={this.preventPropagation}>
        <h2>Change Email Address</h2>
        <form ref='newEmailForm' onSubmit={this.handleSubmit}>
          <div>Old email: {this.props.oldEmail}</div>

          <label>New Email Address:</label>
          <input type='email' className='form-control' onChange={this.newEmailOnChange} /><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-primary' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end ChangeEmailModal


