
import React, { Component } from 'react';


export default class LoginBox extends Component {  

  constructor(props) {
    super(props)
    this.state = { login: true, email: '', password: '', password_verify: '', form_error: false, submit_error: false }
  
  }

  handleSubmit(e) {
    e.preventDefault()

    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(this.state.email)) {
      this.setState({ form_error: true })
      return
    }

    if (this.state.login) {
      Meteor.loginWithPassword(this.state.email, this.state.password, function(error) {
        if (error) {
          console.log(error)
          this.setState({ submit_error: true });
        } else {
          console.log(Meteor.user())
          FlowRouter.go('testpage')
        }
      });
    } else { // signup

      if (this.state.password != this.state.password_verify) {
        this.setState({ form_error: true })
      } else { 
        Accounts.createUser({
          email: this.state.email,
          password: this.state.password
        }, function(error) {
          if (error) {
            console.log(error)
            this.setState({ submit_error: true });
          } else {
            FlowRouter.go('testpage')
          }
        });
      }
    }
  } // end handleSubmit

  // data validators
  changeForm(e) {
    e.preventDefault();
    this.setState({ login: !this.state.login })
  }
  checkEmail(e) {
    this.setState({ email: e.target.value })
  }
  checkPassword(e) {
    this.setState({ password: e.target.value })
  }
  checkPasswordVerify(e) {
    this.setState({ passwordVerify: e.target.value })
  }

  render() {
    const switchFormString = !this.state.login ? "Cancel" : "Sign Up"
    const submitButtonString = this.state.login ? "Login" : "Sign Up"
    return (
      <form className='ui-login-box' onSubmit={this.handleSubmit.bind(this)}>
        <input type='text' onChange={this.checkEmail.bind(this)} placeholder='Email' /><br/>
        <input type='password' onChange={this.checkPassword.bind(this)} placeholder='Password' /><br/>
        { !this.state.login ? <div><input type='password' onChange={this.checkPasswordVerify.bind(this)} placeholder='Retype Password' /> </div>: ''}
        
        { this.state.form_error ? <div className="ui-login-box-error-msg">Please enter a valid email and password</div> : ''}
        { this.state.submit_error ? <div className="ui-login-box-error-msg">Please try again</div> : ''}
        <div className='spacer1'>&nbsp;</div>
        <input type='submit' value={submitButtonString} /><button onClick={this.changeForm.bind(this)}>{switchFormString}</button>
      </form>
    )
  } //  end render

}
