// QLICKER
// Author: Enoch T <me@enocht.am>
//
// admin_dashboard.jsx: admin overview page

import React from 'react'
import { LogoutButton } from '../Buttons'
import ProfileCard from '../ProfileCard'

export const AdminDashboard = function () {
  return (
    <div className='ui-page-container'>

      <div className='ui-top-bar'>
        <a href={Router.routes['admin'].path()} className='ui-wordmark'><h1>Qlicker</h1></a>

        <div className='ui-button-bar'>
          <ProfileCard />
          <LogoutButton redirect='login' />
        </div>
      </div>

      <div className='container ui-admin-page'>
        <h2>Admin Page</h2>

      </div>

    </div>)
}
