
import React, { Component } from 'react';


export class LogoutButton extends Component {  

  constructor(props) {
    super(props)
  }

  logout() {    
    Meteor.logout((error) => {
      if (this.props.redirect) FlowRouter.go(this.props.redirect);
    })
  }

  render() {
    return (<button className='button' onClick={this.logout.bind(this)}>Logout</button>)
  } //  end render

}
