

import React from 'react'
import { LogoutButton } from '../Buttons'
import ProfileCard from '../ProfileCard'
 
export const Testpage = function() {

  return (<div className="container">
    <h2>Qlicker Protected Page</h2>
    <ProfileCard />
    <LogoutButton redirect='loginpage'/>
  </div>)

}
