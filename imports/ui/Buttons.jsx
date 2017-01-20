// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Buttons.jsx: an assortment of small functionality reusable buttons

import React, { Component } from 'react'

/**
 * LogoutButton Component
 * Logout user and redirect to this.props.redirect
 */
export class LogoutButton extends Component {

  logout () {
    Meteor.logout(() => {
      if (this.props.redirect) Router.go(this.props.redirect)
    })
  }

  render () {
    return (<a href='#' className='ui-top-bar-button' onClick={this.logout.bind(this)}>Logout</a>)
  } //  end render

} // end Logoutbutton
