// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// ProfileViewModal

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'
import { ROLES } from '../../configs'
/**
 * modal dialog to prompt for new email addresss
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
  //TODO: probably should not inherit from ControlledForm...
export class ProfileViewModal extends ControlledForm {

  constructor (props) {
    super(props)

    this.sendVerificationEmailTo = this.sendVerificationEmailTo.bind(this)
    this.verifyUserEmail = this.verifyUserEmail.bind(this)
    this.deleteUser = this.deleteUser.bind(this)
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.setState({})
    this.props.done()
  }

  verifyUserEmail (email) {
    Meteor.call('users.verifyEmail', email, (e, d) => {
      if (e) alertify.error(e)
      if (d) {
        alertify.success('Email verified')
        this.forceUpdate()
      }
    })
  }

  sendVerificationEmailTo (user) {
    Meteor.call('users.sendVerificationEmailTo', user._id, (e) => {
      if (e) alertify.error('Error sending email ' + e)
      else alertify.success('Email sent')
    })
  }

  deleteUser (user) {
    if (confirm('Are you really sure?')) {
      Meteor.call('users.delete', user, (e) => {
        if (e) alertify.error('Error deleting user ' + e)
        else {
          alertify.success('User deleted')
          this.props.done()
        }
      })
    }
  }

  renderAdminControls () {
    let viewUser = Meteor.user()
    const user = this.props.user
    if (viewUser.hasGreaterRole(ROLES.admin)) {
      const sendVerificationEmailTo = (e) => this.sendVerificationEmailTo(user._id)
      const verifyUserEmail = (e) => this.verifyUserEmail(user.getEmail())
      const deleteUser = (e) => this.deleteUser(user)
      return (
        <div className='ql-profile-container'>
          {user.emails[0].verified ? ''
              : <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                <a className='btn btn-primary' onClick={verifyUserEmail}>Verify Email</a>
                <a className='btn btn-primary' onClick={sendVerificationEmailTo}>Send Verification Email</a>
              </div>
            }
          <div className='btn-group btn-group-justified' role='group' aria-label='...'>
            <a className='btn btn-primary' onClick={deleteUser}>Delete User</a>
            {/* <a className='btn btn-danger' onClick={this.done}>Ban User</a> */}
          </div>
        </div>)
    } else { return '' }
  }

  renderUserInfo () {
    const user = this.props.user
    const spanVerified = user.emails[0].verified
      ? <span className='label label-success'>Verified</span>
      : <span className='label label-warning'>Un-verified</span>
    return (
      <div>
        <h2>{user.getName()}</h2>
        <div className='ql-profile-container'>
          Email: {user.getEmail()} - {spanVerified}<br />
          Role: {user.profile.roles[0]}
        </div>
      </div>)
  }

  render () {
    return (this.props.user
      ? <div className='ql-modal-container' >
        <div className='row'>
          <div className='col-md-3' />
          <div className='col-md-6'>
            <div className='ql-profile-card  ql-card'>
              <div className='profile-header ql-header-bar'>
                <h3>
                  {this.props.user.profile.lastname}, {this.props.user.profile.firstname}
                </h3>
              </div>
              <div className='ql-card-content'>
                <div className='ql-profile-image-container' onClick={this.done}>
                  <img className='img-responsive center-block' src={this.props.user.getImageUrl()} />
                </div>
                <br />
                {this.renderUserInfo()}
                {this.renderAdminControls()}
                <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                  <a className='btn btn-default' onClick={this.done}>Close</a>
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-3' />
        </div>
      </div> : 'Loading')
  } //  end render

} // end profileViewModal

ProfileViewModal.propTypes = {
  done: PropTypes.func,
  user: PropTypes.object
}
