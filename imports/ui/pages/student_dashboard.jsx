

import React from 'react'
import { LogoutButton } from '../Buttons'
import ProfileCard from '../ProfileCard'
 
export const StudentDashboard = function() {

  return (<div className="container">
    <h1>Qlicker Student Dasboard Page</h1>
    <ProfileCard />
    <br/>
    <LogoutButton redirect='login'/>
  </div>)

}
