
import React, { Component } from 'react';


export default class LoginBox extends Component {  

  constructor(props) {
    super(props)
    this.state = { login: true, email: '', password: '', password_verify: '', form_error: false, submit_error: false }
  
  }

  handleSubmit(e) {
    e.preventDefault()
    
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
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(e.target.value)) {
      this.setState({ email: e.target.value, form_error: false })
    } else {
      this.setState({ form_error: true })
    }
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
        { this.state.form_error ? <div className="ui-login-box-error-msg">Please enter a valid email and password</div> : ''}
        { this.state.submit_error ? <div className="ui-login-box-error-msg">Please try again</div> : ''}
        Email: <input type='text' onChange={this.checkEmail.bind(this)}/><br/>
        Password: <input type='password' onChange={this.checkPassword.bind(this)}/><br/>
        {!this.state.login ? <div>Retype Password: <input type='password' onChange={this.checkPasswordVerify.bind(this)}/> </div>: ''}
        <input type='submit' value={submitButtonString} /><button onClick={this.changeForm.bind(this)}>{switchFormString}</button>
      </form>
    )
  } //  end render

}
