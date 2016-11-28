import React from 'react'
 
import LoginBox from '../LoginBox.jsx'

export const Loginpage = () => (
<div className="container">
  <h2>Qlicker</h2>
  
  <div className='row'>
    <div className='three columns'>&nbsp;
    </div>

    <div className='six columns ui-loginpage-login-container'>
      <h3>Login/Sign Up</h3>
      <LoginBox/>
    </div>

    <div className='three columns'>&nbsp;
    </div>

  </div>

</div>)
