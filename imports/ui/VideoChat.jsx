// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

import Select from 'react-select'
import 'react-select/dist/react-select.css'

import { Courses } from '../api/courses'
import { Sessions } from '../api/sessions'

import { JitsiWindow } from './JitsiWindow'

import { ROLES } from '../configs'


export class _VideoChat extends Component {

  constructor (props) {
    super(props)

    this.state = {
      api:null
    }

    this.setJitsiApi = this.setJitsiApi.bind(this)
  }

  setJitsiApi(api) {
    this.setState({api:api})

  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    let options = {
     roomName: 'qlicker-jitsi-1',
     width: 500,
     height:500,
     interfaceConfigOverwrite: {
      filmStripOnly: false,
      SHOW_JITSI_WATERMARK: false,
     },
     configOverwrite: {
      disableSimulcast: false,
     },
    }

    let domain = 'meet.qlicker.org'
    return (
      <div className='ql-video-page'>

        <JitsiWindow options={options} domain={domain}  />
      </div>
    )
  }

}

export const VideoChat = withTracker((props) => {
  //const sessionFields = {_id:1, name:1, status:1, reviewable:1, date:1 }
  const handle = Meteor.subscribe('courses.single', props.courseId)

  const course = Courses.findOne(props.courseId)

  return {
    course: course,
    loading: !handle.ready()
  }
})( _VideoChat)

VideoChat.propTypes = {
  courseId: PropTypes.string
}
