// QLICKER
// Author: Hayden Pfeiffer <hayden.pfeiffer@queensu.ca>
//
// EditGradeModal.jsx: modal for editing a response's grade

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'


export class EditGradeModal extends ControlledForm {

  constructor (props) {
    super(props)

    this.state = { points: props.mark.points, outOf: props.mark.outOf }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.submitGrade = this.submitGrade.bind(this)
  }

  submitGrade (points, outOf) {
    
    let mark = this.props.mark
    mark = _.extend(mark, { points: Number(points), outOf: Number(outOf) })
   
    Meteor.call('grades.updateMark', mark, (err) => {
      if (err) alertify.error(err)
      else alertify.success('Updated Mark')
    })
  }

  handleSubmit (e) {
    super.handleSubmit(e)
    this.submitGrade(this.state.points, this.state.outOf)
    this.props.done()
  }

  render () {

    const setPoints = (e) => this.setState({ points: e.target.value })
    const setOutOf = (e) => this.setState({ outOf: e.target.value })

    return(
        <div className='ql-modal-container'>
          <div className='ql-modal ql-modal-newemail ql-card' onClick={this.preventPropagation}>
            <div className='ql-modal-header ql-header-bar'><h3>Edit Response Grade</h3></div>
            <form ref='newEmailForm' className='ql-card-content' onSubmit={this.handleSubmit}>
              <label>Points:</label>
              <input type='text' className='form-control' value={this.state.points} onChange={setPoints} /><br />
              <label>Out of:</label>
              <input type='text' className='form-control' value={this.state.outOf} onChange={setOutOf} /><br />
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

EditGradeModal.proptypes = {
  questionId: PropTypes.string.isRequired,
  done: PropTypes.func.isRequired,
  submit: PropTypes.func.isRequired
}