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

    this.state = { showResendLink: true }
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
  }

  sendVerificationEmail () {
    Meteor.call('users.sendVerificationEmail', (e) => {
      if (e) alertify.error('Error sending email')
      else this.setState({ showResendLink: false })
    })
  }


  render () {
    const user = this.props.user
    const needsEmailVerification = !user.emails[0].verified
    return (
      <div className='container ql-profile-page'>
        <div className='messages'>
          { needsEmailVerification
            ? <div className='alert alert-warning' role='alert' >
              To enroll in some courses, you may need to verify your email. &nbsp;&nbsp;&nbsp;
              { this.state.showResendLink ? <a href='#' onClick={this.sendVerificationEmail}>Resend Email</a> : 'Check your email' }
            </div>
            : '' }
        </div>

        <hr />
        <img src={user.getImageUrl()} alt='Profile Image' className='ql-profile-image' />

        <h2>{user.getName()}</h2>
        <h3>{user.emails[0].address} - Verified: {JSON.stringify(user.emails[0].verified)}</h3>
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

