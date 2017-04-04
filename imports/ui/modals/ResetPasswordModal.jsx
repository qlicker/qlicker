// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ResetPasswordModal.jsx

import React from 'react'

import { ControlledForm } from '../ControlledForm'

/**
 * modal to prompt for email address to send password set email
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class ResetPasswordModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { }
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.requestPasswordResetForm.reset()
    this.setState({})
    this.props.done()
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for enroll form. Calls Accounts.forgotPassword
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    if (!this.state.email) return alertify.error('Error: please enter an email')

    Accounts.forgotPassword({ email: this.state.email }, (e) => {
      this.done()
      if (e) return alertify.error('Error: couldn\'t send password reset email')
      alertify.success('Reset link sent')
    })
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-newemail ql-card' onClick={this.preventPropagation}>
        <div className='ql-modal-header ql-header-bar'><h3>Reset Password</h3></div>
        <form ref='requestPasswordResetForm' className='ql-card-content' onSubmit={this.handleSubmit}>
          <label>Email Address: </label>
          <input type='email' className='form-control' data-name='email' onChange={this.setValue} /><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' value='Send Password Reset Email' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end ResetPasswordModal

