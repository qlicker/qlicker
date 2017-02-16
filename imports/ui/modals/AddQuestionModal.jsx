// QLICKER
// Author: Enoch T <me@enocht.am>
//
// AddQuestionModal.jsx: popup dialog to prompt for course Enrollment details

import React, { PropTypes } from 'react'

import { ControlledForm } from './ControlledForm'

import { DraftHelper } from '../../draft-helpers'

// if (Meteor.isClient) import './.scss'

export const DEFAULT_STATE = {
  deptCode: '',
  courseNumber: '',
  enrollmentCode: ''
}

export class AddQuestionModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = {}

    this.setQuestion = this.setQuestion.bind(this)
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.addQuestionForm.reset()
    this.setState({})
    this.props.done()
  }

  setQuestion (questionId) {
    this.setState({ questionId: questionId })
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for add form. Calls sessions.addQuestion
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    if (!this.state.questionId) {
      alertify.error('Please select a question to add')
      return
    }

    Meteor.call('sessions.addQuestion', this.props.session._id, this.state.questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Question Added')
        this.done()
      }
    })
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-addquestion container' onClick={this.preventPropagation}>
        <div className='ql-modal-header'><h2>Add Question</h2></div>
        <form ref='addQuestionForm' className='ql-form-addquestion' onSubmit={this.handleSubmit}>

          { /* list questions */
            this.props.questions.map(q => {
              return (<div key={q._id} onClick={() => this.setQuestion(q._id)}>
                {q.question}
                { this.state.questionId === q._id ? 'Selected' : '' }
              </div>)
            })
          }

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end AddQuestionModal

AddQuestionModal.propTypes = {
  session: PropTypes.object.isRequired,
  questions: PropTypes.array.isRequired
}
