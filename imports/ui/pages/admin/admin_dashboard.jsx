// QLICKER
// Author: Enoch T <me@enocht.am>
//
// admin_dashboard.jsx: admin overview page

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

class _AdminDashboard extends Component {
  render () {
    return (
      <div className='ql-page-container'>
        <div className='container ql-admin-page'>
          <h2>Admin Page</h2>
          <table className='table table-bordered'>
            <thead>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </thead>
            <tbody>
              {
                this.props.users.map((u) => {
                  return (<tr><td>{u.getName()}</td><td>{u.getEmail()}</td><td>{u.getRole()}</td></tr>)
                })
              }
            </tbody>
          </table>
        </div>

      </div>)
  }
}



export const AdminDashboard = createContainer(() => {
  const handle = Meteor.subscribe('userData')

  const users = Meteor.users.find({ 'profile.roles': { $in: ['professor', 'admin'] } }).fetch()
  console.log(users)
  return {
    users: users,
    loading: !handle.ready()
  }
}, _AdminDashboard)
