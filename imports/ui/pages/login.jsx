// QLICKER
// Author: Enoch T <me@enocht.am>
//
// login.jsx: login page

import React, { Component } from 'react'

import { LoginBox } from '../LoginBox.jsx'

import { ResetPasswordModal } from '../modals/ResetPasswordModal'

export class Loginpage extends Component {

  constructor (props) {
    super(props)

    this.state = { resetPassword: false }
  }
    
  componentWillMount () {
    Meteor.call('settings.getSSOInstitution', (err, institution) => {
      this.setState({ ssoInstitution: institution})
    })
    Meteor.call('settings.getSSOEnabled', (err, result) => {
      this.setState({ ssoEnabled: result})
    })  
  }
    
  render () {
    //Allow email login if it was passed as a prop, or if SSO is not enabled
    //It is passed a prop in the login/email route
    const allowEmailLogin = this.props.allowEmailLogin || !this.state.ssoEnabled ? true : false
    const ssoInstitution = this.state.ssoInstitution
    const ssoEnabled = this.state.ssoEnabled
      
    const togglePasswordResetModal = () => { this.setState({ resetPassword: !this.state.resetPassword }) }
    return (
      <div className='ql-login-page'>
        <div className='ql-outside-header'><h1 className='ql-wordmark'>Qlicker</h1></div>

        <div className='container'>

          <div className='row'>
            <div className='col-md-4'>&nbsp;
            </div>

            <div className='col-md-4 login-container'>
              <LoginBox ssoEnabled={ssoEnabled} ssoInstitution={ssoInstitution} allowEmailLogin={allowEmailLogin}/>
              <br />
              { allowEmailLogin ?
                <div className='center-text'>
                  <a href='#' onClick={togglePasswordResetModal} >Forgot your password?</a>
                </div> : 
                <div className='center-text'>
                  <a href={Router.routes['login.email'].path()} >Have an email based account?</a>
                </div>
               }
            </div>

            <div className='col-md-4'>&nbsp;
            </div>

          </div>
        </div>

        { this.state.resetPassword
          ? <ResetPasswordModal done={togglePasswordResetModal} />
          : '' }
      </div>
    )
  }

}

