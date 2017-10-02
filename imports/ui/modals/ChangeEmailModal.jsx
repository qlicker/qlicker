// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ChangeEmailModal.jsx

import React from 'react'

import { ControlledForm } from '../ControlledForm'

/**
 * modal dialog to prompt for new email addresss
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class ChangeEmailModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { newEmail: '' }
    this.newEmailOnChange = this.newEmailOnChange.bind(this)
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.newEmailForm.reset()
    this.setState({})
    this.props.done()
  }

  newEmailOnChange (e) {
    this.setState({ newEmail: e.target.value })
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for enroll form. Calls users.changeEmail
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    Meteor.call('users.changeEmail', this.state.newEmail, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Verification Email Sent')
        this.done()
      }
    })
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-newemail ql-card' onClick={this.preventPropagation}>
        <div className='ql-modal-header ql-header-bar'><h3>Change Email</h3></div>
        <form ref='newEmailForm' className='ql-card-content' onSubmit={this.handleSubmit}>
          <div className='text'>Old email: {this.props.oldEmail}</div>

          <label>New Email Address:</label>
          <input type='email' className='form-control' onChange={this.newEmailOnChange} /><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end ChangeEmailModal

