// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ManageUsers.jsx: Component for admin user management

import React, { Component } from 'react'

import { RestrictDomainForm } from './RestrictDomainForm'

import { ROLES } from '../configs'

export class ManageUsers extends Component {

  constructor(p) {
    super(p)
    this.state = {
      supportEmail: p.settings.email,
      requireVerified: p.settings.requireVerified,
      email: '',
      password: '',
      password_verify: '',
      firstname: '',
      lastname: ''
    }

    this.saveRoleChange = this.saveRoleChange.bind(this)
    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.verifyUserEmail = this.verifyUserEmail.bind(this)
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
        this.setState({ email:'', password:'', password_verify:'', firstname:'', lastname:''})
      })
    }
  } // end handleSubmit

  verifyUserEmail (email) {
    Meteor.call('users.verifyEmail', email, (e, d) => {
      if (e) alertify.error(e)
      if (d) alertify.success('Email verified')
    })
  }

  render() {
    const setSupportEmail = (e) => { this.setState({ supportEmail: e.target.value }) }

    return(
      <div>
        <div>
          <h4>Support email</h4>
          <form ref='supportForm' onSubmit={this.saveEmail} className='form-inline'>
            <input className='form-control' value={this.state.supportEmail} type='text' onChange={setSupportEmail} placeholder='Support email' />
            <input type='submit' className='btn btn-primary' value='Set' />
          </form>
        </div>

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
              <input className='form-control' type='text' data-name='firstname' onChange={this.setValue} placeholder='First Name' value={this.state.firstname} />
              <input className='form-control' type='text' data-name='lastname' onChange={this.setValue} placeholder='Last Name' value={this.state.lastname} />
            </div>
            <input className='form-control' id='emailField' type='email' data-name='email' onChange={this.setValue} placeholder='Email' value={this.state.email} />
            <br />
            <input className='form-control' id='passwordField' type='password' data-name='password' onChange={this.setValue} placeholder='Password' value={this.state.password} /><br />
            <div><input className='form-control' type='password' data-name='password_verify' onChange={this.setValue} placeholder='Retype Password' value={this.state.password_verify} /><br /></div>
            <div className='spacer1'>&nbsp;</div>
            <input type='submit' id='submitButton' className='btn btn-primary btn-block' value='Submit' />
          </div>
        </form>
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
                      <a href='#' onClick={(e) => this.props.toggleProfileViewModal(u)}>{u.getName()}</a>
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
        </div>
      </div>
    )
  }
}
