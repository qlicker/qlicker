// QLICKER
// Author: Hayden Pfeiffer (hayden.pfeiffer@queensu.ca)
//
// ResponseViewModal.jsx: modal for viewing a full response to a question

import React from 'react';
import PropTypes from 'prop-types';

import _ from 'underscore'

import { ControlledForm } from '../ControlledForm'

import { WysiwygHelper } from '../../wysiwyg-helpers'

export class ResponseViewModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = {
      feedback: '',
    }
    this.setFeedback = this.setFeedback.bind(this)
    this.updateFeedback = this.updateFeedback.bind(this)
    this._DB_updateFeedback =  _.debounce(this.updateFeedback, 500)
  }

  componentDidMount () {

    this.setState({ feedback:this.props.feedback })
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }


  componentWillReceiveProps (nextProps) {

    const feedback = nextProps.feedback
    this.setState({ feedback:feedback })

  }

  updateFeedback(text) {
    this.props.updateFeedback(this.props.studentId, text)
  }

  setFeedback (e) {
    this.setState({ feedback: e.target.value})
    this._DB_updateFeedback(e.target.value)
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.setState({})
    this.props.done()
  }

  render () {
    const outOf = this.props.mark ? this.props.mark.outOf : 0
    //const setFeedback = (e) => _.debounce(this.props.updateFeedback(this.props.studentId, e.target.value),500)

    /*const setFeedback = (e) =>{
       this.setState({ feedback: e.target.value})
       _.debounce(this.props.updateFeedback(this.props.studentId, e.target.value),500)
     }*/

    const setPoints = (e) => this.props.updatePoints(this.props.studentId, parseFloat(e.target.value))
    let saveGrade = undefined
    let cancelChange = undefined
    if(this.props.saveGrade){
      saveGrade = () => {
        this.props.saveGrade(this.props.studentId)
        this.done()
      }
      cancelChange = () => {
        this.props.cancelChange(this.props.studentId)
        this.done()
      }
    }
    //const saveGrade = this.props.saveGrade ? () => this.props.saveGrade(this.props.studentId) : undefined
    //const cancelChange = this.props.cancelChange ? () => this.props.cancelChange(this.props.studentId) : undefined

    return (
      <div className='ql-modal-container' >
        <div className='row'>
          <div className='col-md-2' />
          <div className='col-md-8'>
            <div className='ql-profile-card  ql-card'>
              <div className='profile-header ql-header-bar'>
                <h1>{this.props.studentName}</h1>
              </div>
              <div className='ql-card-content'>
                <div className='ql-responseViewModal'>
                  <div className='ql-responseViewModal-text'>
                    {WysiwygHelper.htmlDiv(this.props.response.answerWysiwyg)}
                  </div>
                  <div className='ql-responseViewModal-controls'>
                    <div className='ql-responseViewModal-controls-grade'>
                      Grade: <input type='number' className='numberField' min='0' max={100} step={0.5} value={this.props.points} onChange={setPoints} maxLength='4' size='4' />
                      <span>&nbsp;/{outOf}</span>
                    </div>
                    <div className='ql-responseViewModal-controls-feedback'>
                      Feedback: <textarea className='textField' value={this.state.feedback} onChange={this.setFeedback} />
                    </div>
                  </div>
                  <div className='ql-responseViewModal-buttons'>
                    { saveGrade ?
                      <div className='btn-group btn-group-justified'>
                        <a className='btn btn-default' onClick={saveGrade} > Save </a>
                        <a className='btn btn-default' onClick={cancelChange} > Cancel </a>
                      </div>
                      : <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                          <a className='btn btn-default' onClick={this.done}>Close</a>
                        </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-2' />
        </div>
      </div>
    )
  } //  end render

} // end ResponseViewModal

ResponseViewModal.propTypes = {
  done: PropTypes.func,
  response: PropTypes.object
}
