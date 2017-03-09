// QLICKER
// Author: Enoch T <me@enocht.am>
//
// LoginBox.jsx: React component for login and signup,
// calls account creation method and redirects after login

import React, { Component } from 'react'
import { _ } from 'underscore'
import { ProfileImages } from '../api/users'

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

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.changeForm = this.changeForm.bind(this)
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
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
            profileImage: this.state.profileImage,
            roles: ['student']
          }
        }, function (error) {
          if (error) {
            console.log(error)
            this.setState({ submit_error: true })
          } else {
            this.sendVerificationEmail()
            this.navigateAfterLogin(Meteor.user())
          }
        }.bind(this))
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

  componentDidUpdate () {
    if (this.state.login) return
    if (Meteor.isTest) return
    new Dropzone('#profile-image-uploader', {
      url: '/some/random/url',
      accept: (file, done) => {
        ProfileImages.insert(file, (err, fileObj) => {
          console.log(fileObj)
          if (err) {
            alertify.error('Error: ' + JSON.stringify(err))
          } else {
            done()
            const imageId = fileObj._id
            console.log(imageId)
            this.setState({ profileImage: imageId })
          }
        })
      }
    })
  }

  render () {
    const switchFormString = this.state.login ? 'Create an Account' : 'Login'
    const submitButtonString = this.state.login ? 'Login' : 'Sign Up'
    const topMessage = this.state.login ? 'Login to Qlicker' : 'Register for Qlicker'
    const haveAccountMessage = this.state.login ? 'Don\'t have an account?' : 'Already have an account?'
    const fillOutInfoMessage = this.state.login ? '' : 'Fill out the information below to get started'
    return (
      <form className='ql-login-box' onSubmit={this.handleSubmit}>
        <h4>{topMessage}</h4>
        <div className='top-account-message'>{fillOutInfoMessage}</div>
        <br />

        { !this.state.login
          ? (
            <div id='profile-image-uploader' className='dropzone ql-profile-image-dropzone'>
              <div className='dz-default dz-message'>
                <span className='glyphicon glyphicon-camera' aria-hidden='true' />
                Upload profile picture
              </div>
            </div>)
          : '' }

        { !this.state.login ? <input className='form-control' type='text' data-name='firstname' onChange={this.setValue} placeholder='First Name' /> : '' }
        { !this.state.login ? <input className='form-control' type='text' data-name='lastname' onChange={this.setValue} placeholder='Last Name' /> : '' }

        <input className='form-control' id='emailField' type='email' data-name='email' onChange={this.setValue} placeholder='Email' /><br />

        <input className='form-control' id='passwordField' type='password' data-name='password' onChange={this.setValue} placeholder='Password' /><br />
        { !this.state.login ? <div><input className='form-control' type='password' data-name='password_verify' onChange={this.setValue} placeholder='Retype Password' /> </div> : ''}

        { this.state.form_error ? <div className='ql-login-box-error-msg'>Please enter a valid email and password</div> : ''}
        { this.state.submit_error ? <div className='ql-login-box-error-msg'>Please try again</div> : ''}
        <div className='spacer1'>&nbsp;</div>
        <input type='submit' id='submitButton' className='btn btn-primary btn-block' value={submitButtonString} />
        <div className='bottom-account-message'>{haveAccountMessage}</div>
        <button className='ql-switch-form-button btn btn-default btn-block' onClick={this.changeForm}>{switchFormString}</button>
      </form>
    )
  } //  end render

}
