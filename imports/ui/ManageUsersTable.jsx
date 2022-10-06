// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ManageUsers.jsx: Component for admin user management

import React, { Component } from 'react'
import { withTracker } from 'meteor/react-meteor-data'
import { Courses } from '../api/courses'
import { RestrictDomainForm } from './RestrictDomainForm'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import _ from 'underscore'
import { ROLES } from '../configs'

MAXUSERS_DEFAULT = 10

export class _ManageUsersTable extends Component {

  constructor(props) {
    super(props)
    this.state = {
      roleNames: [{value:ROLES.admin, label:'admin'},
                  {value:ROLES.prof, label:'professor'},
                  {value:ROLES.student, label:'student'}],
      searchUser:'',
      maxUsers: MAXUSERS_DEFAULT //limit to 10 by default...
    }

    this.saveRoleChange = this.saveRoleChange.bind(this)
    this.verifyUserEmail = this.verifyUserEmail.bind(this)
    this.toggleCanPromote = this.toggleCanPromote.bind(this)
    this.toggleShowAll = this.toggleShowAll.bind(this)

  }

  componentDidMount () {
  }

  saveRoleChange (uId, newRole) {
    if (confirm('Are you sure?')) {
      Meteor.call('users.changeRole', uId, newRole, (e) => {
        if (e) return alertify.error('Error: ' + e.message)
        alertify.success('Role changed')
      })
    }
  }

  verifyUserEmail (email) {
    Meteor.call('users.verifyEmail', email, (e, d) => {
      if (e) alertify.error(e)
      if (d) alertify.success('Email verified')
    })
  }

  toggleCanPromote (id) {
    Meteor.call('users.toggleCanPromote', id, (e, d) => {
      if (e) alertify.error(e)
      if (d) alertify.success('Changed!')
    })
  }


  toggleShowAll() {
    const newVal = this.state.maxUsers > 0 ? 0 : MAXUSERS_DEFAULT
    this.setState({ maxUsers: newVal })
  }

  render() {
    if (this.props.loading ) return <div className='ql-subs-loading'>Loading</div>
    const maxUsers = this.props.maxUsers
    let users = this.props.users
    const totalUsers = users.length

    return(
          <div className = 'ql-admin-user-table'>
            <table className='table table-bordered'>
              <tbody>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Courses</th>
                  <th>Change Role</th>
                </tr>
                {
                  users.map((u) => {
                    let courseList = ''
                    const couldPromote = u.hasRole(ROLES.prof)
                    const toggleCanPromote = () => {this.toggleCanPromote(u._id)}
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
                        {couldPromote ?
                          <div> &nbsp;&nbsp;<input type='checkbox' checked={u.canPromote()} onChange={toggleCanPromote} /> &nbsp; can promote</div>
                          : ''
                        }
                      </td>
                    </tr>)
                  })
                }
              </tbody>
            </table>
          </div>
         )
  }
}

export const ManageUsersTable = withTracker(( props ) => {

  const handle = Meteor.subscribe('users.all') &&  Meteor.subscribe('courses')
  const courses = Courses.find({}, {sort: {name : 1, createdAt: -1}}).fetch()
  let courseNames = {}
  courses.map((c) => {
    courseNames[c._id] = c.courseCode().toUpperCase()+'-'+c.semester.toUpperCase()
  })
  const allUsers = Meteor.users.find({ $or: [ {'profile.lastname': { $regex: props.filterUserSearchString }},
                                              {'profile.firstname': { $regex: props.filterUserSearchString }}
                                            ]
                                      },
                                     { sort: { 'profile.roles.0': 1, 'profile.lastname': 1 },
                                       limit: props.maxUsers
                                     }).fetch()

  return {
    allUsers: allUsers,
    users: allUsers,
    courseNames: courseNames,
    loading: !handle.ready()
  }
})(_ManageUsersTable)
