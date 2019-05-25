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
      SSO_EntityId: props.settings.SSO_EntityId,
      SSO_cert: props.settings.SSO_cert,
      SSO_privCert: props.settings.SSO_privCert,
      SSO_privKey: props.settings.SSO_privKey,
      SSO_identifierFormat: props.settings.SSO_identifierFormat,
      SSO_institutionName: props.settings.SSO_institutionName,
      SSO_emailIdentifier: props.settings.SSO_emailIdentifier,
      SSO_firstNameIdentifier: props.settings.SSO_firstNameIdentifier,
      SSO_lastNameIdentifier: props.settings.SSO_lastNameIdentifier,
      SSO_roleIdentifier: props.settings.SSO_roleIdentifier,
      SSO_studentNumberIdentifier: props.settings.SSO_studentNumberIdentifier,
      SSO_roleProfName: props.settings.SSO_roleProfName,
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
      SSO_EntityId: this.state.SSO_EntityId || '',
      SSO_cert: this.state.SSO_cert || '',
      SSO_privCert: this.state.SSO_privCert || '',
      SSO_privKey: this.state.SSO_privKey || '',
      SSO_identifierFormat: this.state.SSO_identifierFormat || '',
      SSO_emailIdentifier: this.state.SSO_emailIdentifier || '',
      SSO_firstNameIdentifier: this.state.SSO_firstNameIdentifier || '',
      SSO_lastNameIdentifier: this.state.SSO_lastNameIdentifier || '',
      SSO_institutionName: this.state.SSO_institutionName || '',
      SSO_roleIdentifier: this.state.SSO_roleIdentifier || '',
      SSO_studentNumberIdentifier: this.state.SSO_studentNumberIdentifier || '',
      SSO_roleProfName: this.state.SSO_roleProfName || '',
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
      <div className='container'>
        <div className ='row' >
          <div className='col-md-3'/>
            <div className='col-md-6'>
              <form className='ql-admin-form-box' onSubmit={this.setSSO}>
              <h4>SSO Settings</h4>
                <h3><input type='checkbox' data-name='SSO_enabled' checked={this.state.SSO_enabled} onChange={this.toggleSSO} />  Enable SSO</h3> <br />
                { this.state.SSO_enabled ?
                  <div>
                    <input className='form-control' type='text' data-name='SSO_entrypoint' onChange={this.setValue} placeholder='IDP Entry Point' value={this.state.SSO_entrypoint}/><br />
                    <input className='form-control' type='text' data-name='SSO_logoutUrl' onChange={this.setValue} placeholder='IDP Logout URL' value={this.state.SSO_logoutUrl} /><br />
                    <input className='form-control' type='text' data-name='SSO_EntityId' onChange={this.setValue} placeholder='Entity ID (e.g. qlicker)' value={this.state.SSO_EntityId} /><br />
                    <input className='form-control' type='text' data-name='SSO_identifierFormat' onChange={this.setValue} placeholder='Identifier Format' value={this.state.SSO_identifierFormat} /><br />
                    <input className='form-control' type='text' data-name='SSO_institutionName' onChange={this.setValue} placeholder='Institution Name' value={this.state.SSO_institutionName} /><br />
                    <input className='form-control' type='text' data-name='SSO_emailIdentifier' onChange={this.setValue} placeholder='Email Identifier' value={this.state.SSO_emailIdentifier} /><br />
                    <input className='form-control' type='text' data-name='SSO_firstNameIdentifier' onChange={this.setValue} placeholder='First Name Identifier' value={this.state.SSO_firstNameIdentifier} /><br />
                    <input className='form-control' type='text' data-name='SSO_lastNameIdentifier' onChange={this.setValue} placeholder='Last Name Identifier' value={this.state.SSO_lastNameIdentifier} /><br />
                    <input className='form-control' type='text' data-name='SSO_roleIdentifier' onChange={this.setValue} placeholder='Role Identifier' value={this.state.SSO_roleIdentifier} /><br />
                    <input className='form-control' type='text' data-name='SSO_roleProfName' onChange={this.setValue} placeholder='Name of professor role for auto-promote' value={this.state.SSO_roleProfName} /><br />
                    <input className='form-control' type='text' data-name='SSO_studentNumberIdentifier' onChange={this.setValue} placeholder='Student Number Identifier' value={this.state.SSO_studentNumberIdentifier} /><br />
                    IDP certificate (single string, no BEGIN-END)
                    <textarea className='form-control certificate' data-name='SSO_cert' onChange={this.setValue} placeholder='IDP Certificate (single string, no BEGIN-END)' value={this.state.SSO_cert} />
                    SP public certificate (can contain BEGIN-END)
                    <textarea className='form-control certificate'  data-name='SSO_privCert' onChange={this.setValue} placeholder='SP Certificate (no BEGIN - END)' value={this.state.SSO_privCert} /><br />
                    SP private key (can contain BEGIN-END)
                    <textarea className='form-control certificate'  data-name='SSO_privKey' onChange={this.setValue} placeholder='SP Key (WITH BEGIN - END)' value={this.state.SSO_privKey} /><br />
                    <div className='spacer1'>&nbsp;</div>
                    <input type='submit' id='submitButton' className='btn btn-primary btn-block' value='Submit' />
                  </div>
                : ''
               }
               </form>
            </div>
          <div className='col-md-3'/>
        </div>
      </div>
    )
  }
}
