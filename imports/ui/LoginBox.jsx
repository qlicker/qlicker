/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// LoginBox.jsx: React component for login and signup,
// calls account creation method and redirects after login

import React, { Component } from 'react'
import { _ } from 'underscore'

if (Meteor.isClient) import './LoginBox.scss'

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

export class LoginBox extends Component {

  constructor (props) {
    super(props)
    this.state = _.extend({}, DEFAULT_STATE)
  }

  handleSubmit (e) {
    e.preventDefault()

    // check if email is an email
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // eslint-disable-line 
    if (!re.test(this.state.email)) {
      this.setState({ form_error: true })
      return
    }

    if (this.state.login) {
      Meteor.loginWithPassword(this.state.email, this.state.password, function (error) {
        if (error) {
          console.log(error)
          this.setState({ submit_error: true })
        } else this.navigateAfterLogin(Meteor.user())
      }.bind(this))
    } else {
      // signup
      if (this.state.password !== this.state.password_verify) {
        this.setState({ form_error: true })
      } else {
        Accounts.createUser({
          email: this.state.email,
          password: this.state.password,
          profile: {
            firstname: this.state.firstname,
            lastname: this.state.lastname,
            roles: ['student']
          }
        }, function (error) {
          if (error) {
            console.log(error)
            this.setState({ submit_error: true })
          } else this.navigateAfterLogin(Meteor.user())
        }.bind(this))
      }
    } // end else
  } // end handleSubmit

  navigateAfterLogin (user) {
    if (Meteor.userHasRole(user, 'admin')) Router.go('admin')
    if (Meteor.userHasRole(user, 'professor')) Router.go('professor')
    if (Meteor.userHasRole(user, 'student')) Router.go('student')
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

  render () {
    const switchFormString = !this.state.login ? 'Cancel' : 'Sign Up'
    const submitButtonString = this.state.login ? 'Login' : 'Sign Up'
    return (
      <form className='ui-login-box' onSubmit={this.handleSubmit.bind(this)}>
        { !this.state.login ? <div><input type='text' data-name='firstname' onChange={this.setValue.bind(this)} placeholder='First Name' /></div> : '' }
        { !this.state.login ? <div><input type='text' data-name='lastname' onChange={this.setValue.bind(this)} placeholder='Last Name' /></div> : '' }

        <input type='text' data-name='email' onChange={this.setValue.bind(this)} placeholder='Email' /><br />
        <input type='password' data-name='password' onChange={this.setValue.bind(this)} placeholder='Password' /><br />
        { !this.state.login ? <div><input type='password' data-name='password_verify' onChange={this.setValue.bind(this)} placeholder='Retype Password' /> </div> : ''}

        { this.state.form_error ? <div className='ui-login-box-error-msg'>Please enter a valid email and password</div> : ''}
        { this.state.submit_error ? <div className='ui-login-box-error-msg'>Please try again</div> : ''}
        <div className='spacer1'>&nbsp;</div>
        <input type='submit' value={submitButtonString} /><button className='ui-switch-form-button' onClick={this.changeForm.bind(this)}>{switchFormString}</button>
      </form>
    )
  } //  end render

}
