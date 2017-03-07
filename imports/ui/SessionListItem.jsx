/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { Component, PropTypes } from 'react'

import { ListItem } from './ListItem'
import '../api/courses.js'
import { SESSION_STATUS_STRINGS } from '../configs'

export class SessionListItem extends ListItem {

  deleteItem (e) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure?')) {
      Meteor.call('courses.deleteSession',
        this.props.session.courseId,
        this.props.session._id,
        (error) => { console.log(error) })
    }
  }

  render () {
    const session = this.props.session
    const navigateToSession = () => {
      if (Meteor.user().hasGreaterRole('professor')) Router.go('session.run', { _id: session._id })
      else Router.go('session', { _id: session._id })
    }
    const navigateToEdit = (e) => {
      e.preventDefault()
      e.stopPropagation()
      Router.go('session.edit', { _id: session._id })
    }
    const controls = this.makeControls()

    const status = session.status
    const strStatus = SESSION_STATUS_STRINGS[status]

    let completion = 0
    if (session.currentQuestion) {
      const index = session.questions.indexOf(session.currentQuestion)
      completion = ((index + 1) / session.questions.length) * 100
    }
    return (
      <div className='ql-session-list-item' onClick={navigateToSession}>
        <div className='row'>
          <div className='col-md-2'>
            <span className={'ql-session-status ' + status}>{strStatus} </span>
          </div>
          <div className='col-md-6'>
            <span className='ql-session-name'>{ session.name }</span>
            <span className='active-time'>{ 'active as of 12/08/2017 @ 3:30pm' }</span>
          </div>
          <div className='col-md-4'>
            <span className='completion'>Completion: {completion}%</span>
            <div className='ql-progress'>
              <div className='ql-progress-bar' style={{ width: completion + '%' }}>&nbsp;</div>
            </div>
          </div>
        </div>

        { this.props.controls ? <span className='controls'>{controls}</span> : '' }
      </div>)
  } //  end render

}

SessionListItem.propTypes = {
  session: PropTypes.object.isRequired
}

