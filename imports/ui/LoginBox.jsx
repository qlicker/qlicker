
import React, { Component } from 'react';


export default class LoginBox extends Component {  

  constructor(props) {
    super(props);
    this.state = { email: '', password: '' };
  
  }

  handleSubmit(e) {
    Meteor.loginWithPassword(this.state.email, this.state.password, function(error) {
      if (error) console.log(error);
      console.log(Meteor.user())
    });

    e.preventDefault();
  }

  // data validators
  checkEmail(e) {
    //TODO validate string
    this.setState({ email: e.target.value }); 
  }
  checkPassword(e) {
    //TODO validate string
    this.setState({ password: e.target.value });
  }

  // TODO add signup mode

  render() {
    return (
      <form className='ui-login-box' onSubmit={this.handleSubmit.bind(this)}>
        Email: <input type='text' onChange={this.checkEmail.bind(this)}/><br/>
        Password: <input type='text' onChange={this.checkPassword.bind(this)}/><br/>
        <input type='submit' value='Login' />
      </form>
    )
  } //  end render

}
