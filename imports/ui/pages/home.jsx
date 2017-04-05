// QLICKER
// Author: Enoch T <me@enocht.am>
//
// home.jsx: home public facing page

import React from 'react'

export const Homepage = () => (
  <div className='container ql-home-page'>
    <a className='btn btn-default pull-right' href='/login'>Login/Create Account</a>
    <br />
    <img className='home-page-poster' src='/images/poster.jpg' alt='poster' />
  </div>)
