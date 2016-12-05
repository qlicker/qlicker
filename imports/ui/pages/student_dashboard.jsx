

import React from 'react'
import { LogoutButton } from '../Buttons'
import ProfileCard from '../ProfileCard'

export const StudentDashboard = function() {

return (
<div className='ui-page-container'>

  <div className='ui-top-bar'>
    <a href={Router.routes['student'].path()} className='ui-wordmark'><h1>Qlicker</h1></a>

    <div className='ui-button-bar'>
      <ProfileCard />
      <LogoutButton redirect='login'/>
    </div>
  </div>

  <div className='container ui-student-page'>

    
    <h2>My Classes</h2>
    <button>Add Course</button>

    <hr/>

    <ul>
      <li>CISC121</li>
      <li>CISC124</li>
      <li>CISC365</li>
    </ul>

  </div>

</div>)
}
