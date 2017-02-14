// QLICKER
// Author: Enoch T <me@enocht.am>
//
// admin_dashboard.jsx: admin overview page

import React from 'react'
import { LogoutButton } from '../Buttons'
import ProfileCard from '../ProfileCard'

export const AdminDashboard = function () {
  return (
    <div className='ql-page-container'>

      <div className='ql-top-bar'>
        <a href={Router.routes['admin'].path()} className='ql-wordmark'><h1>Qlicker</h1></a>

        <div className='ql-button-bar'>
          <ProfileCard />
          <LogoutButton redirect='login' />
        </div>
      </div>

      <div className='container ql-admin-page'>
        <h2>Admin Page</h2>

      </div>

    </div>)
}
