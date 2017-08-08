// QLICKER
// Author: Enoch T <me@enocht.am>
//
// admin_dashboard.jsx: admin overview page

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { ROLES } from '../../../configs'

class _AdminDashboard extends Component {

  constructor (p) {
    super(p)

    this.state = { email: '', role: '' }

    this.saveRoleChange = this.saveRoleChange.bind(this)
    this.saveUserRole = this.saveUserRole.bind(this)
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

  render () {
    const setEmail = (e) => { this.setState({ email: e.target.value }) }
    const setUserRole = (e) => { this.setState({ role: e.target.value }) }

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
      </div>)
  }
}

export const AdminDashboard = createContainer(() => {
  const handle = Meteor.subscribe('users.all')

  const users = Meteor.users.find({ 'profile.roles': { $in: [ROLES.prof, ROLES.admin] } }, { sort: { 'profile.roles.0': 1 } }).fetch()
  return {
    users: users,
    loading: !handle.ready()
  }
}, _AdminDashboard)
