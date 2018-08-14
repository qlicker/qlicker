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
    this.toggleSSO = this.toggleSSO.bind(this)
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  setSSO (e) {
    e.preventDefault()

    let settings = Settings.findOne()
    settings = _.extend(settings, { 
      SSO_enabled: this.state.SSO_enabled || false,
      SSO_entrypoint: this.state.SSO_entrypoint || '',
      SSO_logoutUrl: this.state.SSO_logoutUrl || '',
      SSO_cert: this.state.SSO_cert || '',
      SSO_identifierFormat: this.state.SSO_identifierFormat || '',
      SSO_emailIdentifier: this.state.SSO_emailIdentifier || '',
      SSO_firstNameIdentifier: this.state.SSO_firstNameIdentifier || '',
      SSO_lastNameIdentifier: this.state.SSO_lastNameIdentifier || '',
      SSO_institutionName: this.state.SSO_institutionName || ''
    })
    
    Meteor.call('settings.update', settings, (e, d) => {
      if (e) alertify.error('Error updating settings')
      else alertify.success('Settings updated')
    })
    
  } // end setSSO

  toggleSSO (e) { 
    e.persist()
    this.setState({ SSO_enabled: !this.state.SSO_enabled }, () => {
      this.setSSO(e)
    })    
  }  

  render() {

    return(
      <div className='col-md-4'>        
        <h4>Enable single sign on</h4>
        <input type='checkbox' checked={this.state.SSO_enabled} onChange={this.toggleSSO} />
        <br />
        { this.state.SSO_enabled
          ? <form className='ql-admin-login-box col-md-12' onSubmit={this.setSSO}>
              <h4>SSO Settings</h4>         
                <input className='form-control' type='text' data-name='SSO_entrypoint' onChange={this.setValue} placeholder='Entry Point' value={this.state.SSO_entrypoint}/><br />
                <input className='form-control' type='text' data-name='SSO_logoutUrl' onChange={this.setValue} placeholder='Logout URL' value={this.state.SSO_logoutUrl} /><br />
                <input className='form-control' type='text' data-name='SSO_cert' onChange={this.setValue} placeholder='Certificate' value={this.state.SSO_cert} /><br />
                <input className='form-control' type='text' data-name='SSO_identifierFormat' onChange={this.setValue} placeholder='Identifier Format' value={this.state.SSO_identifierFormat} /><br />
                <input className='form-control' type='text' data-name='SSO_institutionName' onChange={this.setValue} placeholder='Institution Name' value={this.state.SSO_institutionName} /><br />
                <input className='form-control' type='text' data-name='SSO_emailIdentifier' onChange={this.setValue} placeholder='Email Identifier' value={this.state.SSO_emailIdentifier} /><br />
                <input className='form-control' type='text' data-name='SSO_firstNameIdentifier' onChange={this.setValue} placeholder='First Name Identifier' value={this.state.SSO_firstNameIdentifier} /><br />
                <input className='form-control' type='text' data-name='SSO_lastNameIdentifier' onChange={this.setValue} placeholder='Last Name Identifier' value={this.state.SSO_lastNameIdentifier} /><br />
                <div className='spacer1'>&nbsp;</div>
                <input type='submit' id='submitButton' className='btn btn-primary btn-block' value='Submit' />          
            </form>
          : ''
        }
      </div>
    )
  }
}