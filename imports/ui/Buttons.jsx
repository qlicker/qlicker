
import React, { Component } from 'react'


export class LogoutButton extends Component {

  constructor(props) {
    super(props)
  }

  logout() {
    Meteor.logout((error) => {
      if (this.props.redirect) Router.go(this.props.redirect);
    })
  }

  render() {
    return (<a href='#' className='ui-top-bar-button' onClick={this.logout.bind(this)}>Logout</a>)
  } //  end render

} // end Loginbutton
