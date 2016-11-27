

import React from 'react'
import { LogoutButton } from '../Buttons'
 
export const Testpage = () => (
<div className="container">
  <h2>Qlicker Protected Page</h2>
  
  <LogoutButton redirect='loginpage'/>

</div>)
