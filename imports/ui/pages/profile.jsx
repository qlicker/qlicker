// QLICKER
// Author: Enoch T <me@enocht.am>
//
// profile.jsx: page for user profile

import React, { Component } from 'react'
import { Slingshot } from 'meteor/edgee:slingshot'
import { createContainer } from 'meteor/react-meteor-data'

import { ChangeEmailModal } from '../modals/ChangeEmailModal'
import { ChangePasswordModal } from '../modals/ChangePasswordModal'

import { Images } from '../../api/images'

import { DragAndDropArea } from '../DragAndDropArea.jsx'

let UUID = require('uuid-1345')

class _Profile extends Component {

  constructor (props) {
    super(props)

    this.state = {
      showResendLink: true,
      uploadActive: false,
      changingEmail: false,
      changingPassword: false,
      changingName: false,
      storageType: '',
      lastName: '',
      firstName: '',
    }
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
    this.addImage = this.addImage.bind(this)
    this.saveProfileImage = this.saveProfileImage.bind(this)
    this.resizeImage = this.resizeImage.bind(this)
    this.updateProfileImage = this.updateProfileImage.bind(this)
    //this.updateFirstName = this.updateFirstName.bind(this)
    //this.updateLastName = this.updateFirstName.bind(this)
    this.saveName = this.saveName.bind(this)
    this.rotateImage = this.rotateImage.bind(this)
  }

  componentWillMount () {
    //If the SSOlogout URL exists, user is logged in through SSO, don't let them change their password!
    Meteor.call("isSSOSession", (err,result) => {
      if(!err)this.setState({isSSOSession:result})
    })
    Meteor.call('settings.getImageSettings', (e, obj) => {
      if (!e && obj) this.setState({imageSettings:obj})
      })
  }
  componentDidMount () {
    this.setStorageType()
    user = Meteor.user()
    if(user){
      this.setState({firstName: user.profile.firstname, lastName: user.profile.lastname})
    }

  }


  updateProfileImage (file, done) {
    let reader = new window.FileReader()
    reader.readAsDataURL(file)
    reader.addEventListener('loadend', function (event) {
      const fileURL = reader.result
      const UID = UUID.v5({
        namespace: '00000000-0000-0000-0000-000000000000',
        name: fileURL})

      /*
      let image = {UID: UID}
      const existing = Images.findOne(image)
      if (existing && !existing.url.endsWith('/thumbnail')) {
        this.saveProfileImage(existing.url, 'image')
        //console.log(existing.url)
        if (existing.url.startsWith('https://s3.') && existing.url.endsWith('/image')) {
          this.saveProfileImage(existing.url.slice(0, -5) + 'thumbnail', 'thumbnail')

        } else this.saveProfileImage(existing.url, 'thumbnail')

        return
      }*/

      let img = new window.Image()
      img.onload = function () {
        const meta = {UID: UID, type: 'image', src: img.src}
        Meteor.call('settings.getImageSettings', (e, obj) => {
          if (e) alertify.error('Error while getting settings')
          if (obj) this.resizeImage(obj.maxImageWidth, obj.storageType, img, meta, true)
        })
      }.bind(this)
      //this is needed or the function never returns?
      img.src = fileURL

      // Makes a thumbnail
      let thumb = new window.Image()
      thumb.onload = function () {
        const meta = {UID: UID, type: 'thumbnail', src: thumb.src}
        Meteor.call('settings.getImageSettings', (e, obj) => {
          if (e) alertify.error('Error while getting settings')
          if (obj) this.resizeImage(50, obj.storageType, thumb, meta, true)
        })
      }.bind(this)
      //this is needed or the function never returns?
      thumb.src = event.target.result
    }.bind(this))
  }

  addImage (image) {
    Meteor.call('images.insert', image, (e) => {
      if (e) return alertify.error('Error updating image')
    })
  }

  saveProfileImage (profileImageUrl, type) {
    if (!type || type === 'image') {
      Meteor.call('users.updateProfileImage', profileImageUrl, (err) => {
        if (err) return alertify.error('Error: could not save image')
        setTimeout(() => {
          alertify.success('Profile image updated')
          this.setState({ uploadActive: false })
        }, 800)
      })
    } else if (type === 'thumbnail') {
      Meteor.call('users.updateProfileThumbnail', profileImageUrl, (err) => {
        if (err) return alertify.error('Error: could not save image')
        setTimeout(() => {
          alertify.success('Profile thumbnail image updated')
          this.setState({ uploadActive: false })
        }, 800)
      })
    }
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
    Meteor.call('settings.getImageSettings', (e, d) => {
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

    let slingshotThumbnail = new Slingshot.Upload(storageType, meta)
    canvas.toBlob((blob) => {
      slingshotThumbnail.send(blob, (e, downloadUrl) => {
        if (e) alertify.error('Error uploading')
        else if (save) {
          img.url = downloadUrl
          this.saveProfileImage(img.url, meta.type)
          img.UID = meta.UID
          this.addImage(img)
        }
      })
    })
  }
  rotateImage (degrees) {
    console.log("rotating")
    let originalURL = this.props.user.getImageUrl()
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d');
    let img = new Image;
    //img.onload = function(){
      //context.drawImage(img,0,0); // Or at whatever offset you like
    //};
    img.src = this.props.user.getImageUrl()
    context.rotate(degrees*Math.PI/180);

    const UID = UUID.v5({
      namespace: '00000000-0000-0000-0000-000000000000',
      name: img.src})

    const meta = {UID: UID, type: 'image', src: img.src}
    let slingshotThumbnail = new Slingshot.Upload(this.state.imageSettings.storageType, meta)
    canvas.toBlob((blob) => {
      slingshotThumbnail.send(blob, (e, downloadUrl) => {
        if (e) alertify.error('Error uploading')
        else {
          img.url = downloadUrl
          this.saveProfileImage(img.url, meta.type)
          img.UID = meta.UID
          this.addImage(img)
        }
      })
    })

  }

  saveName() {
    Meteor.call('users.updateName', this.state.lastName,this.state.firstName, (err) => {
      if (err) alertify.error("Error: "+ err.error)
      else alertify.success("Name updated")
      this.setState({ changingName:false })
    })
  }

  render () {
    const user = this.props.user
    const needsEmailVerification = !user.emails[0].verified

    const toggleUpload = () => { this.setState({ uploadActive: !this.state.uploadActive }) }
    const toggleChangeEmailModal = () => { this.setState({ changingEmail: !this.state.changingEmail }) }
    const toggleChangePasswordModal = () => { this.setState({ changingPassword: !this.state.changingPassword }) }
    const toggleChangingName = () => { this.setState({ changingName: !this.state.changingName }) }
    const updateFirstName = (e) => {this.setState({ firstName:e.target.value }) }
    const updateLastName = (e) => {this.setState({ lastName:e.target.value }) }
    const rotateCl = () => {this.rotateImage(90)}
    const rotateCC = () => {this.rotateImage(-90)}
    const saveName = () => {this.saveName()}

    const noEdits = this.state.isSSOSession
    const noEmail = (user.services && user.services.sso)

    const spanVerified = user.emails[0].verified
      ? <span className='label label-success'>Verified</span>
      : <span className='label label-warning'>Un-verified</span>
    return (
      <div className='container ql-profile-page'>
        <div className='messages'>
          { needsEmailVerification
            ? <div className='alert alert-warning' role='alert' >
              For access to certain courses, you may need to verify your email. &nbsp;&nbsp;&nbsp;
              { this.state.showResendLink ? <a href='#' onClick={this.sendVerificationEmail}>Resend Email</a> : 'Check your email' }
            </div>
            : '' }
        </div>

        <div className='row'>
          <div className='col-md-4' />
          <div className='col-md-4'>

            <div className='ql-profile-card ql-card'>
              <div className='profile-header ql-header-bar'>
                <h4> User Profile</h4>
              </div>

              <div className='ql-card-content'>
                <div className='ql-profile-image-container'>
                  { !this.state.uploadActive
                    ? <div>
                        <div className='ql-profile-image' style={{ backgroundImage: 'url(' + user.getImageUrl() + ')' }}>
                          &nbsp;
                          {needsEmailVerification
                            ? ''
                            : <div className='ql-image-upload-new-button' onClick={toggleUpload}>Upload new image</div>
                          }
                        </div>
                        <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                           <a href='#' className='btn btn-default' onClick={rotateCC} >Rotate <i className='fas fa-undo' /></a>
                           <a href='#' className='btn btn-default' onClick={rotateCl} >Rotate <i className='fas fa-redo' /></a>
                        </div>
                      </div>

                    : <div>
                      <DragAndDropArea onDrop={this.updateProfileImage} maxFiles={1}>
                         <div className='ql-profile-image-droparea dropzone'>
                           <div className='dz-default dz-message'>
                             <span className='glyphicon glyphicon-camera' aria-hidden='true' />
                               Drag and Drop an image to upload
                           </div>
                         </div>
                       </DragAndDropArea>
                       <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                          <a href='#' className='btn btn-default' onClick={toggleUpload} >Cancel</a>
                       </div>
                      </div>

                    }
                </div>


                { noEdits ? '' :
                  <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                     {noEmail ? '' : <a href='#' className='btn btn-default' onClick={toggleChangeEmailModal} >Change Email</a> }
                    <a href='#' className='btn btn-default' onClick={toggleChangePasswordModal} >Change Password</a>
                  </div>
                 }
                <br />
                <div>
                  { this.state.changingName ?
                      <div className='ql-profile-name-container'>
                        <input type='text' placeholder='Last' value={this.state.lastName} onChange={updateLastName}/>
                        <input type='text' placeholder='First' value={this.state.firstName} onChange={updateFirstName}/>
                        <div className='ql-profile-name-little-button' onClick={toggleChangingName}> cancel </div>
                        <div className='ql-profile-name-little-button' onClick={saveName}> save </div>
                      </div>
                    : <div className='ql-profile-name-container'>
                        <div className='ql-profile-name'>{user.getName()}</div>
                        { noEdits ?
                          ''
                          : <div className='ql-profile-name-little-button' onClick={toggleChangingName}> change name</div>
                        }
                      </div>
                  }



                </div>
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
  const handle = Meteor.subscribe('userData')

  return {
    user: Meteor.users.findOne({ _id: Meteor.userId() }), // user object needs to be reactive
    loading: !handle.ready()
  }
}, _Profile)
