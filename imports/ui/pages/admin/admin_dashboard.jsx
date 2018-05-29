// QLICKER
// Author: Enoch T <me@enocht.am>
//
// admin_dashboard.jsx: admin overview page

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { RestrictDomainForm } from '../../RestrictDomainForm'

import { Settings } from '../../../api/settings'

import { Courses } from '../../../api/courses'

import { ROLES } from '../../../configs'

import { ProfileViewModal } from '../../modals/ProfileViewModal'

import { Slingshot } from 'meteor/edgee:slingshot'

class _AdminDashboard extends Component {

  constructor (p) {
    super(p)

    this.state = {
      role: '',
      size: p.settings.maxImageSize,
      width: p.settings.maxImageWidth,
      supportEmail: p.settings.email,
      requireVerified: p.settings.requireVerified,
      storageType: p.settings.storageType,
      bucket:  p.settings.bucket,
      region: p.settings.region,
      accessKey: p.settings.accessKey,
      secret: p.settings.secret
    }

    this.saveRoleChange = this.saveRoleChange.bind(this)
    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.saveImageSize = this.saveImageSize.bind(this)
    this.saveImageWidth = this.saveImageWidth.bind(this)
    this.setStorage = this.setStorage.bind(this)
    this.verifyUserEmail = this.verifyUserEmail.bind(this)
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
  }

  saveRoleChange (uId, newRole) {
    if (confirm('Are you sure?')) {
      Meteor.call('users.changeRole', uId, newRole, (e) => {
        if (e) return alertify.error('Error: ' + e.message)
        alertify.success('Role changed')
      })
    }
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  saveImageSize (e) {
    e.preventDefault()

    let settings = Settings.findOne()
    settings.maxImageSize = !isNaN(Number(this.state.size)) ? Number(this.state.size) : 0
    Meteor.call('settings.update', settings, (e, d) => {
      if (e) alertify.error('Error updating settings')
      else alertify.success('Settings updated')
    })
  }

  saveImageWidth (e) {
    e.preventDefault()

    let settings = Settings.findOne()
    settings.maxImageWidth = !isNaN(Number(this.state.width)) ? Number(this.state.width) : 0
    Meteor.call('settings.update', settings, (e, d) => {
      if (e) alertify.error('Error updating settings')
      else alertify.success('Settings updated')
    })
  }

  setStorage (e) {
    e.preventDefault

    let settings = Settings.findOne()
    settings.storageType = this.state.storageType
    if(settings.storageType === 'AWS') {
      settings.bucket = this.state.bucket
      settings.region = this.state.region
      settings.accessKey = this.state.accessKey
      settings.secret = this.state.secret
    } else {
      settings.bucket = ''
      settings.region = ''
      settings.accessKey = ''
      settings.secret = ''
    }
    
    Meteor.call('settings.update', settings, (e, d) => {
      if (e) alertify.error('Error updating settings')
      else alertify.success('Settings updated')
    })
    
  }

  verifyUserEmail (email) {
    Meteor.call('users.verifyEmail', email, (e, d) => {
      if (e) alertify.error(e)
      if (d) alertify.success('Email verified')
    })
  }

  toggleProfileViewModal (userToView = null) {
    this.setState({ profileViewModal: !this.state.profileViewModal, userToView: userToView })
  }

  handleSubmit (e) {
    e.preventDefault()
      // signup
    if (this.state.password !== this.state.password_verify) {
      alertify.error('Passwords don\'t match')
    } else {
      let role = 'student'
      const user = {
        email: this.state.email,
        password: this.state.password,
        profile: {
          firstname: this.state.firstname,
          lastname: this.state.lastname,
          profileImage: this.state.profileImage,
          roles: [role]
        }
      }
      Meteor.call('users.createFromAdmin', user, (e, data) => {
        if (e) alertify.error(e.reason)
        else alertify.success('User created')
      })
    }
  } // end handleSubmit

  render () {
    const setImageSize = (e) => { this.setState({ size: e.target.value }) }
    const setImageWidth = (e) => { this.setState({ width: e.target.value }) }
    const setSupportEmail = (e) => { this.setState({ supportEmail: e.target.value }) }
    const setStorageType = (e) => { this.setState({ storageType: e.target.value })}
    const setBucket = (e) => { this.setState({ bucket: e.target.value }) }
    const setRegion = (e) => { this.setState({ region: e.target.value }) }
    const setAccessKey = (e) => { this.setState({ accessKey: e.target.value }) }
    const setSecret = (e) => { this.setState({ secret: e.target.value }) }
    
    return (
      <div className='container ql-admin-page'>
        <h1>Dashboard</h1>
        <br />

        <div>
          <h4>Support email</h4>
          <form ref='supportForm' onSubmit={this.saveEmail} className='form-inline'>
            <input className='form-control' value={this.state.supportEmail} type='text' onChange={setSupportEmail} placeholder='Support email' />
            <input type='submit' className='btn btn-primary' value='Set' />
          </form>
        </div>
        <div className='ql-admin-settings'>
          <div>
            <h2>Image Settings</h2>
            <br />      
        
            <h4>Maximum image size (in MB, after rescaling to max width)</h4>
            <form ref='imageSizeForm' onSubmit={this.saveImageSize} className='form-inline'>
              <input className='form-control' value={this.state.size} type='text' onChange={setImageSize} placeholder='Image size' />
              <input type='submit' className='btn btn-primary' value='Set' />
            </form>

            <h4>Maximum image width (px)</h4>
            <form ref='imageWidthForm' onSubmit={this.saveImageWidth} className='form-inline'>
              <input className='form-control' value={this.state.width} type='text' onChange={setImageWidth} placeholder='Image width' />
              <input type='submit' className='btn btn-primary' value='Set' />
            </form>
              
            <form className='ql-admin-login-box col-md-4' onSubmit={this.setStorage}>
              <h4>Image Storage Settings</h4> 
              <div className='ql-card-content inputs-container'>
                <select className='form-control' onChange={setStorageType} value={this.state.storageType}>
                  <option value='None'>None</option>
                  <option value='AWS'>AWS S3</option>
                  <option value='Azure'>Microsoft Azure Blob</option>
                </select>
                <br />
                { this.state.storageType === 'AWS' 
                  ? <div>
                      <input className='form-control' type='text' value={this.state.bucket} onChange={setBucket} placeholder='Bucket Name' /><br />
                      <input className='form-control' type='text' value={this.state.region} onChange={setRegion} placeholder='Region' /><br />
                      <input className='form-control' type='text' value={this.state.accessKey} onChange={setAccessKey} placeholder='AWS Access Key Id' /><br />
                      <input className='form-control' type='text' value={this.state.secret} onChange={setSecret} placeholder='AWS Secret' /><br />
                    </div>
                  : ''
                }
                <div className='spacer1'>&nbsp;</div>
                <input type='submit' id='submitStorage' className='btn btn-primary btn-block' value='Submit' />
              </div>
            </form>        
          </div>
                  
          <div>
            <h2>User Settings</h2>
            <br /> 
            
            <h4>Require verified email to login</h4>
            <input type='checkbox' checked={this.state.requireVerified} onChange={this.setVerified} />
            <br />

            <RestrictDomainForm
              done={() => { return true }}
              settings={this.props.settings}
            />
            <br />
            
            <form className='ql-admin-login-box col-md-4' onSubmit={this.handleSubmit}>
              <h4>Add user manually</h4>  
              <div className='ql-card-content inputs-container'>
                <div className='input-group'>
                  <input className='form-control' type='text' data-name='firstname' onChange={this.setValue} placeholder='First Name' />
                  <input className='form-control' type='text' data-name='lastname' onChange={this.setValue} placeholder='Last Name' />
                </div>
                <input className='form-control' id='emailField' type='email' data-name='email' onChange={this.setValue} placeholder='Email' />
                <br />
                <input className='form-control' id='passwordField' type='password' data-name='password' onChange={this.setValue} placeholder='Password' /><br />
                <div><input className='form-control' type='password' data-name='password_verify' onChange={this.setValue} placeholder='Retype Password' /><br /></div>
                <div className='spacer1'>&nbsp;</div>
                <input type='submit' id='submitButton' className='btn btn-primary btn-block' value='Submit' />
              </div>
            </form>
          </div>
        </div>

        <div>
          <h1>Users (with elevated permissions first)</h1>
          <table className='table table-bordered'>
            <tbody>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Courses</th>
                <th>Change Role</th>
              </tr>

              {
                this.props.allUsers.map((u) => {
                  let courseList = ''
                  if (u.profile.courses && this.props) {
                    u.profile.courses.forEach(function (cId) {
                      courseList += this.props.courseNames[cId] ? this.props.courseNames[cId] + ' ' : ''
                    }.bind(this))
                  }
                  return (<tr key={u._id}>
                    <td>
                      <a href='#' onClick={(e) => this.toggleProfileViewModal(u)}>{u.getName()}</a>
                    </td>
                    <td>{u.getEmail()} &nbsp;&nbsp; {u.emails[0].verified ? '(verified)'
                        : <a href='#' onClick={(e) => this.verifyUserEmail(u.getEmail())}>Verify</a>}
                    </td>
                    <td>{courseList}</td>
                    <td>
                      <select onChange={(e) => this.saveRoleChange(u._id, e.target.value)} value={u.getRole()}>
                        { Object.keys(ROLES).map((r) => <option key={'role_' + ROLES[r]} value={ROLES[r]}>{ROLES[r]}</option>)}
                      </select>
                      &nbsp;&nbsp;{u.isInstructorAnyCourse() && u.hasRole('student') ? '(TA)' : ''}
                    </td>
                  </tr>)
                })
              }
            </tbody>
          </table>
          { this.state.profileViewModal
            ? <ProfileViewModal
              user={this.state.userToView}
              done={this.toggleProfileViewModal} />
          : '' }
        </div>
      </div>)
  }
}

export const AdminDashboard = createContainer(() => {
  const handle = Meteor.subscribe('users.all') && Meteor.subscribe('settings') &&
    Meteor.subscribe('courses')
  const courses = Courses.find().fetch()
  let courseNames = {}
  courses.map((c) => {
    courseNames[c._id] = c.courseCode().toUpperCase()
  })
  const settings = Settings.find().fetch()[0]
  const allUsers = Meteor.users.find({ }, { sort: { 'profile.roles.0': 1, 'profile.lastname': 1 } }).fetch()
  return {
    settings: settings,
    allUsers: allUsers,
    courseNames: courseNames,
    loading: !handle.ready()
  }
}, _AdminDashboard)
