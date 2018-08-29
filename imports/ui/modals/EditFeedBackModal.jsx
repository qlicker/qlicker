// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// EditFeedBackModal.jsx: modal for editing feedback to a response

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'


export class EditFeedBackModal extends ControlledForm {

  constructor (props) {
    super(props)

    this.state = { feedback: props.mark.feedback || '' }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.submitFeedback = this.submitFeedback.bind(this)
  }

  submitFeedback (feedback) {
    
    let mark = this.props.mark
    mark = _.extend(mark, { feedback: feedback })

    Meteor.call('grades.updateMark', mark, (err) => {
      if (err) alertify.error(err)
      else alertify.success('Updated Mark')
    })
  }

  handleSubmit (e) {
    super.handleSubmit(e)
    this.submitFeedback(this.state.feedback)
    this.props.done()
  }

  render () {

    const setFeedback = (e) => this.setState({ feedback: e.target.value })

    return(
        <div className='ql-modal-container'>
          <div className='ql-modal ql-modal-newemail ql-card' onClick={this.preventPropagation}>
            <div className='ql-modal-header ql-header-bar'><h3>Edit Response Feedback</h3></div>
            <form ref='newEmailForm' className='ql-card-content' onSubmit={this.handleSubmit}>
              <label>Feedback:</label>
              <textarea className='form-control' value={this.state.feedback} onChange={setFeedback} /><br />
              <div className='ql-buttongroup'>
              <a className='btn btn-default' onClick={this.props.done}>Cancel</a>
                <input className='btn btn-default' type='submit' id='submit' />
              </div>
            </form>
          </div>
        </div>
    )
  }
}

EditFeedBackModal.proptypes = {
  questionId: PropTypes.string.isRequired,
  done: PropTypes.func.isRequired,
  submit: PropTypes.func.isRequired
}