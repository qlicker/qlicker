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

  render () {
    const togglePasswordResetModal = () => { this.setState({ resetPassword: !this.state.resetPassword }) }
    return (
      <div className='ql-login-page'>
        <div className='ql-outside-header'><h1 className='ql-wordmark'>Qlicker</h1></div>

        <div className='container'>

          <div className='row'>
            <div className='col-md-4'>&nbsp;
            </div>

            <div className='col-md-4 login-container'>
              <LoginBox />
              <br />
              <div className='center-text'>
                <a href='#' onClick={togglePasswordResetModal} >Forgot your password?</a>
              </div>
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

