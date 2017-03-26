// QLICKER
// Author: Enoch T <me@enocht.am>
//
// profiile.jsx: page for user profile

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'
import $ from 'jquery'

import { ChangeEmailModal } from '../modals/ChangeEmailModal'
import { ChangePasswordModal } from '../modals/ChangePasswordModal'

import { ProfileImages } from '../../api/users'

class _Profile extends Component {

  constructor (props) {
    super(props)

    this.state = {
      showResendLink: true,
      uploadActive: false,
      user: this.props.user,
      changingEmail: false,
      changingPassword: false
    }
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
  }

  saveProfileImage (profileImageId) {
    Meteor.call('users.updateProfileImage', profileImageId, (err) => {
      if (err) return alertify.error('Error: could not save image')
      setTimeout(() => {
        alertify.success('Profile image updated')
        this.setState({ uploadActive: false })
        $('.dz-success.dz-complete').remove()
      }, 500)
    })
  }

  sendVerificationEmail () {
    Meteor.call('users.sendVerificationEmail', (e) => {
      if (e) alertify.error('Error sending email')
      else this.setState({ showResendLink: false })
    })
  }

  componentDidUpdate () {
    if (!this.state.uploadActive) return
    if (Meteor.isTest) return
    new Dropzone('#profile-image-uploader', {
      url: '/some/random/url',
      accept: (file, done) => {
        ProfileImages.insert(file, (err, fileObj) => {
          console.log(fileObj)
          if (err) {
            alertify.error('Error: ' + JSON.stringify(err))
          } else {
            done()
            const imageId = fileObj._id
            this.saveProfileImage(imageId)
          }
        })
      }
    })
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ user: nextProps.user })
  }

  render () {
    const user = this.state.user
    const needsEmailVerification = !user.emails[0].verified

    const toggleUpload = () => { this.setState({ uploadActive: !this.state.uploadActive }) }
    const toggleChangeEmailModal = () => { this.setState({ changingEmail: !this.state.changingEmail }) }
    const toggleChangePasswordModal = () => { this.setState({ changingPassword: !this.state.changingPassword }) }

    const spanVerified = user.emails[0].verified
      ? <span className='label label-success'>Verified</span>
      : <span className='label label-warning'>Un-verified</span>
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

        <div className='row'>
          <div className='col-md-4' />
          <div className='col-md-4'>

            <div className='ql-profile-card ql-card'>
              <div className='profile-header ql-header-bar'>
                <h4>Edit User Profile</h4>
              </div>

              <div className='ql-card-content'>
                <div className='ql-profile-image-container'>
                  { !this.state.uploadActive
                    ? (<div>
                      <img src={user.getImageUrl()} alt='Profile Image' className='ql-profile-image' />
                      <div className='ql-image-upload-new-button' onClick={toggleUpload}>Upload new image</div>
                    </div>
                    )
                    : (<div id='profile-image-uploader' className='dropzone ql-profile-image-dropzone'>
                      <div className='dz-default dz-message'>
                        <span className='glyphicon glyphicon-camera' aria-hidden='true' />
                        Drag and Drop a new picture
                      </div>
                    </div>) }
                </div>

                <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                  <a href='#' className='btn btn-default' onClick={toggleChangeEmailModal} >Change Email</a>
                  <a href='#' className='btn btn-default' onClick={toggleChangePasswordModal} >Change Password</a>
                </div>
                <br />
                <h2>{user.getName()}</h2>
                <div className='ql-profile-container'>
                  Email: {user.getEmail()} - {spanVerified}<br />
                  Role: {user.profile.roles[0]}
                </div>
              </div>

            </div>
          </div>
          <div className='col-md-4' />
        </div>

        { this.state.changingEmail
          ? <ChangeEmailModal oldEmail={this.state.user.getEmail()} done={toggleChangeEmailModal} />
          : '' }

        { this.state.changingPassword
          ? <ChangePasswordModal done={toggleChangePasswordModal} />
          : '' }

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

