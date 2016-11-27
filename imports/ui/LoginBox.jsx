
import React, { Component } from 'react';


export default class LoginBox extends Component {  

  constructor(props) {
    super(props)
    this.state = { login: true, email: '', password: '', password_verify: '' }
  
  }

  handleSubmit(e) {
    if (this.state.login) {
      Meteor.loginWithPassword(this.state.email, this.state.password, function(error) {
        if (error) console.log(error)
        console.log(Meteor.user())
      });
    } else { // signup
      // TODO one last check for same passwords
      Accounts.createUser({
        email: this.state.email,
        password: this.state.password
      }, function(error) {
        if (error) console.log(error)
      });
    
    }
    e.preventDefault()
  }

  // data validators
  changeForm(e) {
    e.preventDefault();
    this.setState({ login: !this.state.login })
  }
  checkEmail(e) {
    //TODO validate string
    this.setState({ email: e.target.value })
  }
  checkPassword(e) {
    //TODO validate string
    this.setState({ password: e.target.value })
  }
  checkPasswordVerify(e) {
    //TODO validate string
    this.setState({ passwordVerify: e.target.value })
  }


  // TODO add signup mode

  render() {
    const switchFormString = !this.state.login ? "Cancel" : "Sign Up"
    const submitButtonString = this.state.login ? "Login" : "Sign Up"
    return (
      <form className='ui-login-box' onSubmit={this.handleSubmit.bind(this)}>
        Email: <input type='text' onChange={this.checkEmail.bind(this)}/><br/>
        Password: <input type='password' onChange={this.checkPassword.bind(this)}/><br/>
        {!this.state.login ? <div>Retype Password: <input type='password' onChange={this.checkPasswordVerify.bind(this)}/> </div>: ''}
        <input type='submit' value={submitButtonString} /><button onClick={this.changeForm.bind(this)}>{switchFormString}</button>
      </form>
    )
  } //  end render

}
