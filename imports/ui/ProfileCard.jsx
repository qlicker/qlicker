// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ProfileCard.jsx: React component for diaplying profile info
// button UI with hover dropdown functionality to display details

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

if (Meteor.isClient) import './ProfileCard.scss'

import '../api/users.js'

export class ProfileCard extends Component {

  constructor (props) {
    super(props)
    this.user = this.props.user[0]
    this.mouseOver = this.mouseOver.bind(this)
    this.mouseOut = this.mouseOut.bind(this)
  }

  mouseOver () {
    ReactDOM.findDOMNode(this.refs.profile_expanded).className = 'ql-profile-card-expanded show'
  }

  mouseOut () {
    ReactDOM.findDOMNode(this.refs.profile_expanded).className = 'ql-profile-card-expanded'
  }

  render () {
    const name = this.user.profile.firstname + ' ' + this.user.profile.lastname
    return (<div className='ql-profile-card'>
        <a href='#' onMouseOver={this.mouseOver} onMouseOut={this.mouseOut}>{ name }</a>
        <div className='ql-profile-card-expanded' ref='profile_expanded'>
          Name: { name }<br />
          Email: { this.user.emails[0].address }<br />
          Roles: { this.user.profile.roles }
        </div>
      </div>)
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
