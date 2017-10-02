// QLICKER
// Author: Enoch T <me@enocht.am>
//
// AddTAModal.jsx

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'
import '../../api/users.js'

/**
 * modal for profs to make new prof accounts
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class AddTAModal extends ControlledForm {

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
   * onSubmit handler for add TA form. Calls courses.addTA
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    Meteor.call('courses.addTA', this.state.newEmail, this.props.courseId, (error) => {
      if (error) return alertify.error('Error: ' + error.message)
      alertify.success('TA added to course')
      this.done()
    })
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-newemail ql-card' onClick={this.preventPropagation}>
        <div className='ql-modal-header ql-header-bar'><h3>Add a TA to {this.props.courseName}</h3></div>
        <form ref='newEmailForm' className='ql-card-content' onSubmit={this.handleSubmit}>

          <div className='text'>Enter a instructor's Qlicker account email address to give them access to this course.</div>

          <label>Email:</label>
          <input type='email' className='form-control' onChange={this.newEmailOnChange} /><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end AddTAModal

AddTAModal.propTypes = {
  done: PropTypes.func,
  courseId: PropTypes.string,
  courseName: PropTypes.string
}
