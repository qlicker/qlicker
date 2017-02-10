/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { Component, PropTypes } from 'react'

if (Meteor.isClient) import './SessionListItem.scss'

import '../api/courses.js'

export class SessionListItem extends Component {

  constructor (props) {
    super(props)

  }

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
    const navigateToSession = () => { Router.go('session', { _id: this.props.session._id }) }
    const testAlert = () => { alert('hello') }
    return (
      <li className='ui-session-list-item' onClick={Meteor.user().hasRole('professor') ? navigateToSession : testAlert}>
        <span className='ui-session-name'>{ this.props.session.name }</span>
        <span className='ui-session-status'>{ this.props.session.status } </span>
        { Meteor.user().hasGreaterRole('professor') ? <span className='controls'><button onClick={this.deleteItem.bind(this)}>Delete</button></span> : ''}
      </li>)
  } //  end render

}

SessionListItem.propTypes = {
  session: PropTypes.object.isRequired
}

