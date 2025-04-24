// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ManageUsers.jsx: Component for admin user management

import React, { Component } from 'react'

import { RestrictDomainForm } from './RestrictDomainForm'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import _ from 'underscore'
import { ROLES } from '../configs'

MAXUSERS_DEFAULT = 10

export class ManageMainSettings extends Component {

  constructor(props) {
    super(props)
    this.state = {
      supportEmail: props.settings.email,
    }

    this.saveEmail = this.saveEmail.bind(this)
    this.toggleRequireVerified = this.toggleRequireVerified.bind(this)

  }

  componentDidMount () {

  }

  saveEmail () {
     Meteor.call('settings.setAdminEmail',this.props.settings._id, this.state.supportEmail, (e, d) => {
       if (e){
         alertify.error(e)
         this.setState({ supportEmail: this.props.settings.email })
       }
       else{
         alertify.error('Server restart required!')
       }
     })
  }

  toggleRequireVerified () {
    Meteor.call('settings.toggleRequireVerified',this.props.settings._id, (e, d) => {
      if (e){
        alertify.error(e)
      }
      else{
        alertify.success('updated!')
      }
      this.setState({ requireVerified: this.props.settings.requireVerified })
    })
  }

  render() {
    const setSupportEmail = (e) => { this.setState({ supportEmail: e.target.value }) }

    return(
      <div className='container'>
        <div className='row'>
          <div className='col-md-4'>
            <h4>Support email</h4>
            <div>
              <input className='form-control' value={this.state.supportEmail} type='text' onChange={setSupportEmail} placeholder='Support email' />
              <button className='btn btn-primary' onClick={() => {this.saveEmail()}} >Set email </button>
            </div>
            <h4>Require verified email to login</h4>
            <input type='checkbox' checked={this.props.settings.requireVerifie} onChange={this.toggleRequireVerified} />
            <br />

            <RestrictDomainForm
              done={() => { return true }}
              settings={this.props.settings}
            />
            <br />
          </div>
      </div>
    </div>
    )
  }
}
