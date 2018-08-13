// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ManageUsers.jsx: Component for admin server management

import React, { Component } from 'react'

import { Settings } from '../api/settings'

export class ManageServer extends Component {

  constructor(p) {
    super(p)
    this.state = {
      size: p.settings.maxImageSize,
      width: p.settings.maxImageWidth,
      storageType: p.settings.storageType,
      AWS_bucket:  p.settings.AWS_bucket,
      AWS_region: p.settings.AWS_region,
      AWS_accessKey: p.settings.AWS_accessKey,
      AWS_secret: p.settings.AWS_secret,
      Azure_accountName: p.settings.Azure_accountName,
      Azure_accountKey: p.settings.Azure_accountKey,
      Azure_containerName: p.settings.Azure_containerName
    }

    this.saveImageSize = this.saveImageSize.bind(this)
    this.saveImageWidth = this.saveImageWidth.bind(this)
    this.setStorage = this.setStorage.bind(this)
  }

  saveImageSize (e) {
    e.preventDefault()

    let settings = Settings.findOne()
    settings.maxImageSize = !isNaN(Number(this.state.size)) ? Number(this.state.size) : 0
    Meteor.call('settings.update', settings, (e, d) => {
      if (e) alertify.error('Error updating settings')
      else alertify.success('Settings updated')
    })
  }

  saveImageWidth (e) {
    e.preventDefault()

    let settings = Settings.findOne()
    settings.maxImageWidth = !isNaN(Number(this.state.width)) ? Number(this.state.width) : 0
    Meteor.call('settings.update', settings, (e, d) => {
      if (e) alertify.error('Error updating settings')
      else alertify.success('Settings updated')
    })
  }

  setStorage (e) {
    e.preventDefault()

    let settings = Settings.findOne()
    settings.storageType = this.state.storageType
    if (settings.storageType === 'AWS') {
      settings.AWS_bucket = this.state.AWS_bucket
      settings.AWS_region = this.state.AWS_region
      settings.AWS_accessKey = this.state.AWS_accessKey
      settings.AWS_secret = this.state.AWS_secret
      settings.Azure_accountName = ''
      settings.Azure_accountKey = ''
      settings.Azure_containerName = ''
    } else if (settings.storageType === 'Azure') {
      settings.AWS_bucket = ''
      settings.AWS_region = ''
      settings.AWS_accessKey = ''
      settings.AWS_secret = ''
      settings.Azure_accountName = this.state.Azure_accountName
      settings.Azure_accountKey = this.state.Azure_accountKey
      settings.Azure_containerName = this.state.Azure_containerName
    } else {
      settings.AWS_bucket = ''
      settings.AWS_region = ''
      settings.AWS_accessKey = ''
      settings.AWS_secret = ''
      settings.Azure_accountName = ''
      settings.Azure_accountKey = ''
      settings.Azure_containerName = ''
    }
    
    Meteor.call('settings.updateImageSettings', settings, (e, d) => {
      if (e) alertify.error('Error updating settings')
      else alertify.success('Settings updated')
    })
    
  } // end setStorage
  render() {
    const setImageSize = (e) => { this.setState({ size: e.target.value }) }
    const setImageWidth = (e) => { this.setState({ width: e.target.value }) }
    const setStorageType = (e) => { this.setState({ storageType: e.target.value })}
    const setAWSBucket = (e) => { this.setState({ AWS_bucket: e.target.value }) }
    const setAWSRegion = (e) => { this.setState({ AWS_region: e.target.value }) }
    const setAWSAccessKey = (e) => { this.setState({ AWS_accessKey: e.target.value }) }
    const setAWSSecret = (e) => { this.setState({ AWS_secret: e.target.value }) }
    const setAzureAccount = (e) => { this.setState({ Azure_accountName: e.target.value })}
    const setAzureKey = (e) => { this.setState({ Azure_accountKey: e.target.value })}
    const setAzureContainer = (e) => { this.setState({ Azure_containerName: e.target.value })}

    return(
      <div>   
        <h4>Maximum image size (in MB, after rescaling to max width)</h4>
        <form ref='imageSizeForm' onSubmit={this.saveImageSize} className='form-inline'>
          <input className='form-control' value={this.state.size} type='text' onChange={setImageSize} placeholder='Image size' />
          <input type='submit' className='btn btn-primary' value='Set' />
        </form>

        <h4>Maximum image width (px)</h4>
        <form ref='imageWidthForm' onSubmit={this.saveImageWidth} className='form-inline'>
          <input className='form-control' value={this.state.width} type='text' onChange={setImageWidth} placeholder='Image width' />
          <input type='submit' className='btn btn-primary' value='Set' />
        </form>
          
        <form className='ql-admin-login-box col-md-4' onSubmit={this.setStorage}>
          <h4>Image Storage Settings</h4> 
          <div className='ql-card-content inputs-container'>
            <select className='form-control' onChange={setStorageType} value={this.state.storageType}>
              <option value='None'>None</option>
              <option value='AWS'>Amazon S3</option>
              <option value='Azure'>Microsoft Azure Blob</option>
              <option value='Local'>Local Storage (Not Recommended)</option>
            </select>
            <br />
            { this.state.storageType === 'AWS' 
              ? <div>
                  <input className='form-control' type='text' value={this.state.AWS_bucket} onChange={setAWSBucket} placeholder='Bucket Name' /><br />
                  <input className='form-control' type='text' value={this.state.AWS_region} onChange={setAWSRegion} placeholder='Region' /><br />
                  <input className='form-control' type='text' value={this.state.AWS_accessKey} onChange={setAWSAccessKey} placeholder='AWS Access Key Id' /><br />
                  <input className='form-control' type='text' value={this.state.AWS_secret} onChange={setAWSSecret} placeholder='AWS Secret' /><br />
                </div>
              : ''
            }
            { this.state.storageType === 'Azure' 
              ? <div>
                  <input className='form-control' type='text' value={this.state.Azure_accountName} onChange={setAzureAccount} placeholder='Azure Account Name' /><br />
                  <input className='form-control' type='text' value={this.state.Azure_accountKey} onChange={setAzureKey} placeholder='Azure Account Key' /><br />
                  <input className='form-control' type='text' value={this.state.Azure_containerName} onChange={setAzureContainer} placeholder='Azure Container' /><br />
                </div>
              : ''
            }
                  
            <div className='spacer1'>&nbsp;</div>
            <input type='submit' id='submitStorage' className='btn btn-primary btn-block' value='Submit' />
          </div>
        </form>        
      </div>
    )
  }
}