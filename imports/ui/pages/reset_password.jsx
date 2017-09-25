// QLICKER
// Author: Enoch T <me@enocht.am>
//
// reset_password.jsx: page for reseting password

import React from 'react'

import { ControlledForm } from '../ControlledForm'

export class ResetPasswordPage extends ControlledForm {

  constructor (props) {
    super(props)

    this.state = {}
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for enroll form. Calls Accounts.resetPassword
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    if (!this.props.token) return alertify.error('Couldn\'t process password reset request')
    if (!this.state.password || !this.state.verify) return alertify.error('Please enter a new passord')
    if (this.state.password !== this.state.verify) return alertify.error('Passwords don\'t match')

    Accounts.resetPassword(this.props.token, this.state.password, (e) => {
      if (e) return alertify.error('Error: couldn\'t set new password')
      alertify.success('New password set')

      const user = Meteor.user()
      if (user.hasRole('admin')) Router.go('admin')
      if (user.hasRole('professor')) Router.go('professor')
      if (user.hasRole('student')) Router.go('student')
    })
  }

  render () {
    return (
      <div className='ql-login-page'>
        <div className='ql-outside-header'><h1 className='ql-wordmark'>Qlicker</h1></div>

        <div className='container'>

          <div className='row'>
            <div className='col-md-4'>&nbsp;</div>
            <div className='col-md-4 login-container'>

              <form ref='setNewPasswordForm' className='ql-form-enrollcourse' onSubmit={this.handleSubmit}>
                <label>New Password: </label>
                <input type='password' className='form-control' data-name='password' onChange={this.setValue} /><br />

                <label>Verify Password: </label>
                <input type='password' className='form-control' data-name='verify' onChange={this.setValue} /><br />

                <div className='ql-buttongroup'>
                  <input className='btn btn-default' value='Save and Login' type='submit' id='submit' />
                </div>
              </form>

            </div>
            <div className='col-md-4'>&nbsp;</div>
          </div>

        </div>
      </div>
    )
  }

}

