// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ManageUsers.jsx: Component for admin user management

import React, { Component } from 'react'

import { ManageUsersTable } from './ManageUsersTable'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import _ from 'underscore'
import { ROLES } from '../configs'

MAXUSERS_DEF = 25

export class ManageUsers extends Component {

  constructor(props) {
    super(props)
    this.state = {
      email: '',
      password: '',
      password_verify: '',
      firstname: '',
      lastname: '',
      roleNames: [{value:ROLES.admin, label:'admin'},
                  {value:ROLES.prof, label:'professor'},
                  {value:ROLES.student, label:'student'}],
      searchUser:'',
      maxUsers: MAXUSERS_DEF //limit to 10 by default...
    }

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.setFilterUserSearchString = this.setFilterUserSearchString.bind(this)
    this.setMaxUsers = this.setMaxUsers.bind(this)

    // see https://github.com/facebook/react/issues/1360
    this.setFilterUserSearchString = _.debounce(this.setFilterUserSearchString,500)
  }

  componentDidMount () {
    let courseNames = []
    for (let cid in this.props.courseNames ){
      if( this.props.courseNames.hasOwnProperty(cid) )
      courseNames.push({ value: cid, label: this.props.courseNames[cid] })
    }
    this.setState({ courseNames: courseNames })
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

  setFilterUserSearchString (val) {
    this.setState( {filterUserSearchString:val} )
  }

  setMaxUsers (val) {
  //console.log(val)
  this.setState( {maxUsers:parseInt(val) } )
  }

  render() {
    if (this.props.loading ) return <div className='ql-subs-loading'>Loading</div>

    const setSearchCourses = (val) => { this.setState({ searchCourses: val }) }
    const setSearchUser = (e) => {
      this.setState({ searchUser: e.target.value })// need this to update the input box
      this.setFilterUserSearchString(e.target.value)// this debounces the filtering (https://github.com/facebook/react/issues/1360)
    }
    const setSearchRoles = (val) => { this.setState({ searchRoles: val }) }

    const maxUsers = this.state.maxUsers
    const setMaxUsers = (e) => { this.setMaxUsers(e.target.value) }

    return(
      <div className='container'>
        <div className='row'>
          <div className='col-md-6'>
          <form className='ql-admin-login-box' onSubmit={this.handleSubmit}>
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
        </div>
      </div>
      <div className='row'>
        <h1>Users (with elevated permissions first)</h1>
        <div className = 'ql-admin-user-table-container'>
          <div className = 'ql-admin-user-search'>
            <input type='text' placeholder='search by name or email' onChange = {setSearchUser} value={this.state.searchUser} />
            <div className='select-container'>
              <Select
                name='search-course'
                placeholder='Course'
                value={this.state.searchCourses}
                options={this.state.courseNames}
                onChange={setSearchCourses}
                />
            </div>
            <div className='select-container'>
              <Select
                name='search-role'
                placeholder='Role'
                value={this.state.searchRoles}
                options={this.state.roleNames}
                onChange={setSearchRoles}
                />
            </div>
            <div className='ql-label-input-horiz'>
              <label htmlFor="maxUsersInput">Max results:</label>
              <input className="ql-label-input-horiz-number" name="maxUsersInput" type="number" min={5} step={10} max={100} maxLength={5} onChange={setMaxUsers} placeholder='Max users' value={maxUsers} />
            </div>
          </div>
          <ManageUsersTable
             maxUsers={maxUsers}
             courseNames = {this.props.courseNames}
             filterUserSearchString = {this.state.filterUserSearchString ?
                                       this.state.filterUserSearchString : '' }
             searchCourseId = {this.state.searchCourses ?
                               this.state.searchCourses.value: ''}
             searchRole = {this.state.searchRoles ?
                               this.state.searchRoles.value: ''}
             />
        </div>
      </div>
    </div>
    )
  }
}
