// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// ManageUsers.jsx: Component for admin user management

import React, { Component } from 'react'
import PropTypes from 'prop-types';

import Select from 'react-select'
import 'react-select/dist/react-select.css'
import _ from 'underscore'
import { ROLES } from '../configs'

export class ManageJitsi extends Component {

  constructor(props) {
    super(props)
    this.state = {
      jitsiDomain: props.settings.Jitsi_Domain ? props.settings.Jitsi_Domain : '',
      enabledCourses: this.props.settings.Jitsi_EnabledCourses ? this.props.settings.Jitsi_EnabledCourses : []
    }

    this.saveJitsiDomain = this.saveJitsiDomain.bind(this)
    this.toggleEnableJitsi = this.toggleEnableJitsi.bind(this)
    this.saveEnabledCourses = this.saveEnabledCourses.bind(this)
  }

  componentDidMount () {
    let courseNames = []
    for (let cid in this.props.courseNames ){
      if( this.props.courseNames.hasOwnProperty(cid) )
      courseNames.push({ value: cid, label: this.props.courseNames[cid] })
    }
    this.setState({ courseNames: courseNames })
  }

  saveJitsiDomain () {
     Meteor.call('settings.setJitsiDomain',this.props.settings._id, this.state.jitsiDomain, (e, d) => {
       if (e){
         alertify.error(e)
         this.setState({ jitsiDomain: this.props.settings.Jitsi_Domain })
       }
       else{
         alertify.success('Saved')
       }
     })
  }

  toggleEnableJitsi () {
    Meteor.call('settings.toggleEnableJitsi',this.props.settings._id, (e, d) => {
      if (e){
        alertify.error(e)
      }
      else{
        alertify.success('updated!')
      }
      this.setState({ Jitsi_Enabled: this.props.settings.Jitsi_Enabled })
    })
  }

  saveEnabledCourses (val) {
    const courses = _(val).pluck('value')
    this.setState({ enabledCourses: val }, Meteor.call('settings.setJitsiEnabledCourses',this.props.settings._id, courses, (e, d) => {
      if (e){
        alertify.error(e)
      }
      else{
        alertify.success('Saved')
      }
    }))
  }

  render() {
    const setJitsiDomain  = (e) => { this.setState({ jitsiDomain: e.target.value }) }
    const saveEnabledCourses = (val) => { this.saveEnabledCourses(val) }

    return(
      <div className='ql-admin-tab'>

        <div className='ql-admin-tab-col'>
          <div className='ql-card'>
            <div className='ql-header-bar'>
              <h4>Enable/Disable Jitsi chat rooms?</h4>
              <input type='checkbox' checked={!!this.props.settings.Jitsi_Enabled} onChange={this.toggleEnableJitsi} />
            </div>
            { this.props.settings.Jitsi_Enabled
              ? <div className='ql-card-content'>
                  <div>
                    <input className='form-control' value={this.state.jitsiDomain} type='text' onChange={setJitsiDomain} placeholder='Jitsi Domain, e.g. meet.jit.si' />
                    <button className='btn btn-primary' onClick={() => {this.saveJitsiDomain()}} > Save Domain </button>
                  </div>
                  <div className='select-container'>
                    <Select
                      name='search-course'
                      placeholder='Courses for which to enable video'
                      multi
                      value={this.state.enabledCourses}
                      options={this.state.courseNames}
                      onChange={saveEnabledCourses}
                      />
                  </div>
                </div>
              : ''
            }
          </div>
        </div>

      </div>
    )
  }
}

ManageJitsi.propTypes = {
  settings: PropTypes.object.isRequired
}