// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ProfileCard.jsx: React component for diaplying profile info
// button UI with hover dropdown functionality to display details

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import './ProfileCard.scss'

import '../api/users.js'

export class ProfileCard extends Component {

  constructor (props) {
    super(props)
    this.user = this.props.user[0]
  }

  mouseOver () {
    ReactDOM.findDOMNode(this.refs.profile_expanded).className = 'ui-profile-card-expanded show'
  }

  mouseOut () {
    ReactDOM.findDOMNode(this.refs.profile_expanded).className = 'ui-profile-card-expanded'
  }

  render () {
    let r
    if (this.props.loading) r = <div>loading</div>
    else {
      const name = this.user.profile.firstname + ' ' + this.user.profile.lastname
      r = (
        <div className='ui-profile-card'>
          <a href='#' onMouseOver={this.mouseOver.bind(this)} onMouseOut={this.mouseOut.bind(this)}>{ name }</a>
          <div className='ui-profile-card-expanded' ref='profile_expanded'>
          Name: { name }<br />
          Email: { this.user.emails[0].address }<br />
          Roles: { this.user.profile.roles }
          </div>
        </div>)
    }

    return r
  } //  end render

}

// ProfileCard.propTypes = {
//  user: PropTypes.object.isRequired,
// };

export default createContainer(() => {
  const sub = Meteor.subscribe('userData')

  return {
    user: Meteor.users.find({ _id: Meteor.userId() }).fetch(),
    loading: !sub.ready()
  }
}, ProfileCard)
