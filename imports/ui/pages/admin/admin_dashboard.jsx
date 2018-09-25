// QLICKER
// Author: Enoch T <me@enocht.am>
//
// admin_dashboard.jsx: admin overview page

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Settings } from '../../../api/settings'

import { Courses } from '../../../api/courses'

import { ProfileViewModal } from '../../modals/ProfileViewModal'

import { ManageUsers } from '../../ManageUsers'
import { ManageImages } from '../../ManageImages'
import { ManageSSO } from '../../ManageSSO'

class _AdminDashboard extends Component {

  constructor (p) {
    super(p)

    this.state = {
      tab: 'users',
    }
    this.toggleProfileViewModal = this.toggleProfileViewModal.bind(this)
  }

  toggleProfileViewModal (userToView = null) {
    this.setState({ profileViewModal: !this.state.profileViewModal, userToView: userToView })
  }

  render () {

    const setTab = (tab) => { this.setState({ tab: tab })}

    return (

      <div className='ql-admin-page'>

        { this.state.profileViewModal
          ? <ProfileViewModal
            user={this.state.userToView}
            done={this.toggleProfileViewModal} />
          : <span className='ql-admin-toolbar'>
                <span className='title'>Dashboard</span>
                <span className='divider'>&nbsp;</span>
                <span className='button' onClick={() => setTab('users')}>Users</span>
                <span className='divider'>&nbsp;</span>
                <span className='button' onClick={() => setTab('server')}>Images</span>
                <span className='divider'>&nbsp;</span>
                <span className='button' onClick={() => setTab('sso')}>Single Sign On</span>
              </span>
        }

        <div className='ql-admin-settings'>
          { this.state.tab === 'users'
            ? <ManageUsers
                settings={this.props.settings}
                allUsers={this.props.allUsers}
                courseNames={this.props.courseNames}
                toggleProfileViewModal={this.toggleProfileViewModal} />
            : ''
          }
          { this.state.tab === 'server'
            ? <ManageImages settings={this.props.settings} />
            : ''
          }
          { this.state.tab === 'sso'
           ?  <ManageSSO settings={this.props.settings}/>
           : ''
          }
        </div>
      </div>)
  }
}

export const AdminDashboard = createContainer(() => {
  const handle = Meteor.subscribe('users.all') && Meteor.subscribe('settings') &&
                 Meteor.subscribe('courses')
  const courses = Courses.find({}, {sort: {name : 1, createdAt: -1}}).fetch()
  let courseNames = {}
  courses.map((c) => {
    courseNames[c._id] = c.courseCode().toUpperCase()+'-'+c.semester.toUpperCase()
  })
  const settings = Settings.findOne()
  const allUsers = Meteor.users.find({ }, { sort: { 'profile.roles.0': 1, 'profile.lastname': 1 } }).fetch()

  return {
    settings: settings,
    allUsers: allUsers,
    courseNames: courseNames,
    loading: !handle.ready()
  }
}, _AdminDashboard)
