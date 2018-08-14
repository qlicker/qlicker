// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ManageUsers.jsx: Component for admin single sign on management

import React, { Component } from 'react'

import { _ } from 'underscore'

import { Settings } from '../api/settings'

export class ManageSSO extends Component {

  constructor(props) {
    super(props)
    this.state = {
      SSO_enabled: props.settings.SSO_enabled,
      SSO_entrypoint: props.settings.SSO_entrypoint,
      SSO_logoutUrl: props.settings.SSO_logoutUrl,
      SSO_cert: props.settings.SSO_cert,
      SSO_identifierFormat: props.settings.SSO_identifierFormat,
      SSO_institutionName: props.settings.SSO_institutionName,
      SSO_emailIdentifier: props.settings.SSO_emailIdentifier,
      SSO_firstNameIdentifier: props.settings.SSO_firstNameIdentifier,
      SSO_lastNameIdentifier: props.settings.SSO_lastNameIdentifier
    }

    this.setValue = this.setValue.bind(this)
    this.setSSO = this.setSSO.bind(this)
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  setSSO (e) {
    e.preventDefault()

    let settings = Settings.findOne()
    settings = _.extend({ 
      SSO_enabled: this.state.SSO_enabled || '',
      SSO_entrypoint: this.state.SSO_entrypoint || '',
      SSO_logoutUrl: this.state.SSO_logoutUrl || '',
      SSO_cert: this.state.SSO_cert || '',
      SSO_identifierFormat: this.state.SSO_identifierFormat || '',
      SSO_emailIdentifier: this.state.SSO_emailIdentifier || '',
      SSO_firstNameIdentifier: this.state.SSO_firstNameIdentifier || '',
      SSO_lastNameIdentifier: this.state.SSO_lastNameIdentifier || '',
      SSO_institutionName: this.state.SSO_institutionName || ''
    }, settings)
    
    console.log(settings)
    
    Meteor.call('settings.update', settings, (e, d) => {
      if (e) alertify.error('Error updating settings')
      else alertify.success('Settings updated')
    })
    
  } // end setSSO

  render() {

    const toggleSSO = () => { this.setState({ SSO_enabled: !this.state.SSO_enabled })}    
    return(
      <div>        
        <h4>Enable single sign on</h4>
        <input type='checkbox' checked={this.state.SSO_enabled} onChange={toggleSSO} />
        <br />
        { this.state.SSO_enabled
          ? <form className='ql-admin-login-box col-md-4' onSubmit={this.setSSO}>
              <h4>SSO Settings</h4>  
              <div className='ql-card-content inputs-container'>
                <div className='input-group'>
                  <input className='form-control' type='text' data-name='SSO_entrypoint' onChange={this.setValue} placeholder='Entry Point' />
                  <input className='form-control' type='text' data-name='SSO_logoutUrl' onChange={this.setValue} placeholder='Logout URL' />
                </div>
                <input className='form-control' type='text' data-name='SSO_cert' onChange={this.setValue} placeholder='Certificate' />
                <br />
                <input className='form-control' type='text' data-name='SSO_identifierFormat' onChange={this.setValue} placeholder='Identifier Format' /><br />
                <div><input className='form-control' type='text' data-name='SSO_institutionName' onChange={this.setValue} placeholder='Name Identifier' /><br /></div>
                <input className='form-control' type='text' data-name='SSO_emailIdentifier' onChange={this.setValue} placeholder='Email Identifier' /><br />
                <input className='form-control' type='text' data-name='SSO_firstNameIdentifier' onChange={this.setValue} placeholder='First Name Identifier' /><br />
                <input className='form-control' type='text' data-name='SSO_lastNameIdentfier' onChange={this.setValue} placeholder='Last Name Identifier' /><br />
                <div className='spacer1'>&nbsp;</div>
                <input type='submit' id='submitButton' className='btn btn-primary btn-block' value='Submit' />
              </div>
            </form>
          : ''
        }
      </div>
    )
  }
}