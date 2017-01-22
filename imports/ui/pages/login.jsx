// QLICKER
// Author: Enoch T <me@enocht.am>
//
// login.jsx: login page

import React from 'react'

import './login.scss'

import { LoginBox } from '../LoginBox.jsx'

export const Loginpage = () => (
  <div className='container ui-login-page'>
    <h1>Qlicker</h1>

    <div className='row'>
      <div className='three columns'>&nbsp;
      </div>

      <div className='six columns login-container'>
        <h3>Login/Sign Up</h3>
        <LoginBox />
      </div>

      <div className='three columns'>&nbsp;
      </div>

    </div>

  </div>)
