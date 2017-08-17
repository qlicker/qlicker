// QLICKER
// Author: Enoch T <me@enocht.am>
//
// admin_dashboard.jsx: admin overview page

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { RestrictDomainForm } from '../../RestrictDomainForm'

import { Settings } from '../../../api/settings'

import { ROLES } from '../../../configs'

class _AdminDashboard extends Component {

  constructor (p) {
    super(p)

    this.state = { email: '', role: '', size: p.settings.maxImageSize }

    this.saveRoleChange = this.saveRoleChange.bind(this)
    this.saveUserRole = this.saveUserRole.bind(this)
    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this)
    this.saveImageSize = this.saveImageSize.bind(this)
  }

  saveRoleChange (uId, newRole) {
    if (confirm('Are you sure?')) {
      Meteor.call('users.changeRole', uId, newRole, (e) => {
        if (e) return alertify.error('Error: could not change role')
        alertify.success('Role changed')
      })
    }
  }

  saveUserRole (e) {
    e.preventDefault()

    if (!this.state.email || !this.state.role) return alertify.error('Please enter an email and select a role')
    Meteor.call('users.changeRoleByEmail', this.state.email, this.state.role, (e) => {
      if (e) return alertify.error('Error: ' + e.message)
      alertify.success('Role changed')
      this.refs.setUserRoleForm.reset()
    })
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
    })
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

  sendVerificationEmail () {
    Meteor.call('users.sendVerificationEmail', (e) => {
      if (e) alertify.error('Error sending email')
      else this.setState({ showResendLink: false })
    })
  }

  render () {
    const setEmail = (e) => { this.setState({ email: e.target.value }) }
    const setUserRole = (e) => { this.setState({ role: e.target.value }) }
    const setImageSize = (e) => { this.setState({ size: e.target.value }) }
    return (
      <div className='container ql-admin-page'>
        <h2>Admin User Management</h2>
        <br />

        <h4>Set user role by email</h4>
        <form ref='setUserRoleForm' onSubmit={this.saveUserRole} className='form-inline'>
          <input className='form-control' type='email' onChange={setEmail} placeholder='Email' />
          <select className='form-control' onChange={setUserRole} value={this.state.role}>
            <option value='' disabled>Select a role for the user</option>
            { Object.keys(ROLES).map((r) => <option value={ROLES[r]}>{ROLES[r]}</option>)}
          </select>
          <input type='submit' className='btn btn-primary' value='Set User Role' />
        </form>

        <h4>Maximum image size (MB)</h4>
        <form ref='setUserRoleForm' onSubmit={this.saveImageSize} className='form-inline'>
          <input className='form-control' value={this.state.size} type='text' onChange={setImageSize} placeholder='Image size' />
          <input type='submit' className='btn btn-primary' value='Set' />
        </form>

        <RestrictDomainForm
          done={() => { return true }}
          settings={this.props.settings}
        />

        <br />
        <h4>Users with elevated privileges</h4>
        <table className='table table-bordered'>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Change Role</th>
          </tr>
          <tbody>
            {
              this.props.users.map((u) => {
                return (<tr key={u._id}>
                  <td>{u.getName()}</td>
                  <td>{u.getEmail()}</td>
                  <td>
                    <select onChange={(e) => this.saveRoleChange(u._id, e.target.value)} value={u.getRole()}>
                      { Object.keys(ROLES).map((r) => <option value={ROLES[r]}>{ROLES[r]}</option>)}
                    </select>
                  </td>
                </tr>)
              })
            }
          </tbody>
        </table>

        <h4>Add user manually</h4>
        <form className='ql-admin-login-box col-md-4' onSubmit={this.handleSubmit}>
          <div className='ql-card-content inputs-container'>
            <div className='input-group'>
              <input className='form-control' type='text' data-name='firstname' onChange={this.setValue} placeholder='First Name' />
              <input className='form-control' type='text' data-name='lastname' onChange={this.setValue} placeholder='Last Name' />
            </div>

            <input className='form-control' id='emailField' type='email' data-name='email' onChange={this.setValue} placeholder='Email' /><br />

            <input className='form-control' id='passwordField' type='password' data-name='password' onChange={this.setValue} placeholder='Password' /><br />
            <div><input className='form-control' type='password' data-name='password_verify' onChange={this.setValue} placeholder='Retype Password' /><br /></div>

            <div className='spacer1'>&nbsp;</div>
            <input type='submit' id='submitButton' className='btn btn-primary btn-block' value='Submit' />
          </div>
        </form>
      </div>)
  }
}

export const AdminDashboard = createContainer(() => {
  const handle = Meteor.subscribe('users.all') && Meteor.subscribe('settings') && Meteor.subscribe('users')
  const settings = Settings.find().fetch()[0]
  const users = Meteor.users.find({ 'profile.roles': { $in: [ROLES.prof, ROLES.admin] } }, { sort: { 'profile.roles.0': 1 } }).fetch()
  return {
    settings: settings,
    users: users,
    loading: !handle.ready()
  }
}, _AdminDashboard)
