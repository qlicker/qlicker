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

    }

  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    console.log("hello")
    return (
      <div className='ql-video-page'>
        <JitsiWindow />
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
