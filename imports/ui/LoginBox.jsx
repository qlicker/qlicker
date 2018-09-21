// QLICKER
// Author: Enoch T <me@enocht.am>
//
// LoginBox.jsx: React component for login and signup,
// calls account creation method and redirects after login

import React, { Component } from 'react'
import { _ } from 'underscore'

export const DEFAULT_STATE = {
  login: true,
  email: '',
  password: '',
  password_verify: '',
  form_error: false,
  submit_error: false,
  firstname: '',
  lastname: ''
}

/**
 * React component (controlled) with login and signup form. Calls Accounts.createUser and Meteor.loginWithPassword
 * @prop {Question} question - question object
 */
export class LoginBox extends Component {

  constructor (props) {
    super(props)
    this.state = _.extend({}, DEFAULT_STATE)

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.changeForm = this.changeForm.bind(this)
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
    this.loginSSO = this.loginSSO.bind(this)
    //this.setState({ ssoInstitution: this.props.ssoInstitution })
    //this.setState({ ssoEnabled: this.props.ssoEnabled})
  }
  /*
  componentWillMount () {
    Meteor.call('settings.getSSOInstitution', (err, institution) => {
      this.setState({ ssoInstitution: institution})
    })
    Meteor.call('settings.getSSOEnabled', (err, result) => {
      this.setState({ ssoEnabled: result})
    })
  }*/

  loginSSO(e){
   e.preventDefault()
   Meteor.loginWithSaml()
  }

  sendVerificationEmail () {
    Meteor.call('users.sendVerificationEmail', (e) => {
      if (e) alertify.error('Error sending email')
      else this.setState({ showResendLink: false })
    })
  }

  handleSubmit (e) {
    e.preventDefault()
    if (this.state.login) {
      Meteor.loginWithPassword(this.state.email, this.state.password, function (error) {
        if (error) {
          alertify.error(error.reason)
          this.setState({ submit_error: true })
        } else this.navigateAfterLogin(Meteor.user())
      }.bind(this))
    } else {
      // signup
      if (this.state.password !== this.state.password_verify) {
        this.setState({ form_error: true })
      } else {
        Meteor.call('settings.allowedEmailDomain', (this.state.email), (e) => {
          if (e) return alertify.error(e.reason)
          let role = 'student'
          Meteor.call('users.count', (e, res) => {
            if (e) console.log(e)
            else if (res === 0) role = 'admin'
            Accounts.createUser({
              email: this.state.email,
              password: this.state.password,
              profile: {
                firstname: this.state.firstname,
                lastname: this.state.lastname,
                profileImage: this.state.profileImage,
                roles: [role]
              }
            }, function (error) {
              if (error) {
                //console.log(error)
                alertify.error(error.reason)
                this.setState({ submit_error: true })
              } else {
                this.sendVerificationEmail()
                this.navigateAfterLogin(Meteor.user())
              }
            }.bind(this))
          })
        })
      }
    } // end else
  } // end handleSubmit

  navigateAfterLogin (user) {
    if (user.hasRole('admin')) Router.go('admin')
    if (user.hasRole('professor')) Router.go('professor')
    if (user.hasRole('student')) Router.go('student')
  }

  // input bounded methods
  changeForm (e) {
    e.preventDefault()
    this.setState({ login: !this.state.login })
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  //Only show create account link if SSO is disabled
  //Only show login through SSO if SSO is enabled
  //Only show login with email if requested by route when SSO is enabled

  render () {
    const switchFormString = this.state.login ? 'Create an Account' : 'Login'
    const submitButtonString = this.state.login ? 'Login' : 'Sign Up'
    const topMessage = this.state.login ? 'Login to Qlicker' : 'Register for Qlicker'
    const haveAccountMessage = this.state.login ? 'Don\'t have an account?' : 'Already have an account?'

    return (
      <form className='ql-login-box ql-card' onSubmit={this.handleSubmit}>
        <div className='header-container ql-header-bar'>
          <h4 className='header'>{topMessage}</h4>
        </div>
        <div className='ql-card-content inputs-container'>
          { !this.state.login
            ? <div className='input-group'>
              <input className='form-control' type='text' data-name='firstname' onChange={this.setValue} placeholder='First Name' />
              <input className='form-control' type='text' data-name='lastname' onChange={this.setValue} placeholder='Last Name' />
            </div> : '' }
          { this.props.allowEmailLogin ?
          <div>
            <input className='form-control' id='emailField' type='email' data-name='email' onChange={this.setValue} placeholder='Email' /><br />

            <input className='form-control' id='passwordField' type='password' data-name='password' onChange={this.setValue} placeholder='Password' /><br />
            { !this.state.login ? <div><input className='form-control' type='password' data-name='password_verify' onChange={this.setValue} placeholder='Retype Password' /><br /></div> : ''}

            { this.state.form_error ? <div className='ql-login-box-error-msg'>Please enter a valid email and password</div> : ''}
            { this.state.submit_error ? <div className='ql-login-box-error-msg'>An error occurred</div> : ''}
            <div className='spacer1'>&nbsp;</div>
            <input type='submit' id='submitButton' className='btn btn-primary btn-block' value={submitButtonString} />
          </div> : '' }

          { this.props.ssoEnabled ? '' :
            <div>
              <div className='bottom-account-message'>{haveAccountMessage}</div>
              <button className='ql-switch-form-button btn btn-default btn-block' onClick={this.changeForm}>{switchFormString}</button>
            </div>
          }

          { this.props.ssoEnabled ?
                <button className='ql-switch-form-button btn btn-default btn-block' onClick={this.loginSSO}>
                    Login through {this.props.ssoInstitution ? this.props.ssoInstitution : 'SSO'}
                </button> : ''
           }
        </div>
      </form>
    )
  } //  end render

}
