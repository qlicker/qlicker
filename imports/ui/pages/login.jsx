// QLICKER
// Author: Enoch T <me@enocht.am>
//
// login.jsx: login page

import React from 'react'

import { LoginBox } from '../LoginBox.jsx'

export const Loginpage = () => (
  <div className='ql-login-page'>
    <div className='ql-outside-header'><h1 className='ql-wordmark'>Qlicker</h1></div>

    <div className='container'>

      <div className='row'>
        <div className='col-md-4'>&nbsp;
        </div>

        <div className='col-md-4 login-container'>
          <LoginBox />
        </div>

        <div className='col-md-4'>&nbsp;
        </div>

      </div>
    </div>
  </div>)
