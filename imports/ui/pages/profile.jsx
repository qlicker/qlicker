// QLICKER
// Author: Enoch T <me@enocht.am>
//
// profiile.jsx: page for user profile

import React, { Component } from 'react'
import { Slingshot } from 'meteor/edgee:slingshot'
import { createContainer } from 'meteor/react-meteor-data'

import { ChangeEmailModal } from '../modals/ChangeEmailModal'
import { ChangePasswordModal } from '../modals/ChangePasswordModal'

import { Images } from '../../api/images'
import { DragAndDropArea } from '../DragAndDropArea.jsx'

import { Settings } from '../../api/settings'

let UUID = require('uuid-1345')

class _Profile extends Component {

  constructor (props) {
    super(props)

    this.state = {
      showResendLink: true,
      uploadActive: false,
      changingEmail: false,
      changingPassword: false,
      storageType: ''
    }
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
    this.addImage = this.addImage.bind(this)
    this.saveProfileImage = this.saveProfileImage.bind(this)
    this.resizeImage = this.resizeImage.bind(this)
    this.updateProfileImage = this.updateProfileImage.bind(this)
  }

  updateProfileImage (file, done) {
    let reader = new window.FileReader()
    reader.readAsDataURL(file)
    reader.addEventListener('loadend', function (e) {
      const fileURL = reader.result
      const UID = UUID.v5({
        namespace: '00000000-0000-0000-0000-000000000000',
        name: fileURL})
      let image = {UID: UID}
      const existing = Images.findOne(image)

      if (existing) {
        this.saveProfileImage(existing.url)
        return
      }

      let img = new window.Image()
      img.onload = function () {
        const meta = {UID: UID, type: 'image'}
        Meteor.call('settings.find', (e, obj) => {
          if (e) alertify.error('Error while getting settings')
          if (obj) this.resizeImage(obj.maxImageWidth, obj.storageType, img, meta, true)
        })
      }.bind(this)

      img.src = fileURL
      // Makes a thumbnail
      let thumb = new window.Image()
      thumb.onload = function () {
        const meta = {UID: UID, type: 'thumbnail'}
        this.resizeImage(50, this.state.storageType, thumb, meta, false)
      }.bind(this)
      thumb.src = e.target.result
    }.bind(this))
  }

  addImage (image) {
    Meteor.call('images.insert', image, (e) => {
      if (e) return alertify.error('Error updating image')
    })
  }

  saveProfileImage (profileImageUrl) {
    Meteor.call('users.updateProfileImage', profileImageUrl, (err) => {
      if (err) return alertify.error('Error: could not save image')
      setTimeout(() => {
        alertify.success('Profile image updated')
        this.setState({ uploadActive: false })
      }, 800)
    })
  }

  sendVerificationEmail () {
    Meteor.call('users.sendVerificationEmail', (e) => {
      if (e) alertify.error('Error sending email')
      else this.setState({ showResendLink: false })
    })
  }

  shouldComponentUpdate (nextState, nextProps) {
    const userHasChanged = this.props.user !== nextProps.user
    const stateHasChanged = this.state !== nextState
    return userHasChanged || stateHasChanged
  }

  setStorageType() {
    Meteor.call('settings.find', (e, d) => {
      this.setState({ storageType: d.storageType})
    })
  }

  resizeImage (size, storageType, img, meta, save) {
    let width = img.width
    let height = img.height
    if (width > size) {
      width = size
      height = size * img.height / img.width
    }
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    this.setStorageType()
    let slingshotThumbnail = new Slingshot.Upload(storageType, meta)
    canvas.toBlob((blob) => {
      slingshotThumbnail.send(blob, (e, downloadUrl) => {
        if (e) alertify.error('Error uploading')
        else if (save) {
          this.saveProfileImage(downloadUrl.slice(0, -(meta.type.length + 1)))
          img.url = downloadUrl.slice(0, -(meta.type.length + 1))
          img.UID = meta.UID
          this.addImage(img)
        }
      })
    })
  }

  render () {
    const user = this.props.user
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
                      <div className='ql-profile-image' style={{ backgroundImage: 'url(' + user.getImageUrl() + ')' }}>&nbsp;</div>
                      {needsEmailVerification
                        ? ''
                        : <div className='ql-image-upload-new-button' onClick={toggleUpload}>Upload new image</div>}
                    </div>
                    )
                    : (
                      <DragAndDropArea onDrop={this.updateProfileImage} maxFiles={1}>
                        <div className='ql-profile-image-droparea dropzone'>
                          <div className='dz-default dz-message'>
                            <span className='glyphicon glyphicon-camera' aria-hidden='true' />
                              Drag and Drop an image to upload
                          </div>
                        </div>
                      </DragAndDropArea>
                    )
                    }
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
          ? <ChangeEmailModal oldEmail={user.getEmail()} done={toggleChangeEmailModal} />
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
  const handle = Meteor.subscribe('userData') && Meteor.subscribe('settings')

  return {
    user: Meteor.users.find({ _id: Meteor.userId() }).fetch()[0], // user object
    loading: !handle.ready()
  }
}, _Profile)
