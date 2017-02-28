// QLICKER
// Author: Enoch T <me@enocht.am>
//
// profiile.jsx: page for user profile



import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

class _Profile extends Component {

  constructor (props) {
    super(props)

    this.state = {}
  }


  render () {
    const user = this.props.user
    return (
      <div className='container ql-profile-page'>
        <img src={user.getImageUrl()} alt='Profile Image' className='ql-profile-image' />

        <h2>{user.getName()}</h2>
        <h3>{user.emails[0].address}</h3>
        <h3>{user.profile.roles[0]}</h3>

      </div>
    )
  }

}

// meteor reactive data container
export const ProfilePage = createContainer((props) => {
  const handle = Meteor.subscribe('userData')

  return {
    user: Meteor.users.find({ _id: Meteor.userId() }).fetch()[0], // user object
    loading: !handle.ready()
  }
}, _Profile)

