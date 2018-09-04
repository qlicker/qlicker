/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionDetails.jsx

import React, { Component } from 'react'

/**
 * component for displaying and editing session details
 * @param {Session} session - session object
 */
export class SessionDetails extends Component {

  constructor (props) {
    super(props)

    this.state = { editing: false, session: this.props.session }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.setValue = this.setValue.bind(this)
  }

  /**
   * setValue(Event: e)
   * set edited values for session editing
   */
  setValue (e) {
    let stateEdits = this.state
    let key = e.target.dataset.name
    if (key === 'quiz') stateEdits.session[e.target.dataset.name] === (e.target.value === 'true')
    else stateEdits.session[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for session edit form. Calls sessions.edit
   */
  handleSubmit (e) {
    e.preventDefault()

    Meteor.call('sessions.edit', this.state.session, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Session details saved')
        this.setState({ editing: false })
      }
    })
  }

  render () {
    const r = (<div>
      <button className='btn btn-default' ref='runButton' onClick={() => { Router.go('session.run', { sessionId: this.state.session._id }) }}>Run Session</button>

      <textarea className='form-control' data-name='description'
        onChange={this.setValue}
        placeholder='Quiz on topic 3'
        value={this.state.session.description} /><br />
      <select className='form-control' data-name='status' onChange={this.setValue} defaultValue={this.state.session.status}>
        <option value='hidden'>Draft (Hidden)</option>
        <option value='visible'>Visible</option>
        <option value='running'>Active</option>
        <option value='done'>Done</option>
      </select>

      {/* <select className='form-control' data-name='quiz' onChange={this.setValue} defaultValue={this.state.session.quiz}>
        <option value={false}>Lecture Poll</option>
        <option value>Online Quiz</option>
      </select> */}

    </div>)
    return r
  } //  end render

}
