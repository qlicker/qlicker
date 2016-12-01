

import React from 'react'
import { LogoutButton } from '../Buttons'
import ProfileCard from '../ProfileCard'
 
export const Testpage = function() {

  return (<div className="container">
    <h1>Qlicker Protected Page</h1>
    <ProfileCard />
    <br/>
    <LogoutButton redirect='login'/>
  </div>)

}
