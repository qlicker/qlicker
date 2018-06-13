import React, { PropTypes, Component } from 'react'

import _ from 'underscore'

import { WysiwygHelper } from '../wysiwyg-helpers'

export class ResponseDisplay extends Component {
  
  constructor(props) {
    super(props)

    this.state = {
      points: this.props.mark.points,
      outOf: this.props.mark.outOf,
      feedback: this.props.mark.feedback ? this.props.mark.feedback : ''
    }

  }

  render() {
    
    const setPoints = (e) => this.setState({ points: e.target.value })
    const setOutOf = (e) => this.setState({ outOf: e.target.value})
    const setFeedback = (e) => this.setState({ feedback: e.target.value })

    const response = this.props.response
    
    return(
      <div className='response-card-container'>
        <h1 className='response-name'>{this.props.studentName}</h1>
        <div className='response-card-content'>
          <div className='response-card-item'>
            <h2>Response:</h2>
          {
            this.props.questionType === 2 
            ? <div className='response-short-answer'>{WysiwygHelper.htmlDiv(response.answerWysiwyg)}</div>
            : <div className='response-mc-answer'>{response.answer}</div>
          }
          </div>
          <span className='response-grade-container'>
            <h2>Points:</h2>
            <div className='response-grade'>
              <input className='box' value={this.state.points} type='text' onChange={setPoints} />
              <div className='text'>Out Of</div>
              <input className='box' value={this.state.outOf} type='text' onChange={setOutOf} />
            </div>
          </span>
          <span>
            <h2>Feedback:</h2>
            <div className='response-feedback'>
              <textarea className='text-input' value={this.state.feedback} onChange={setFeedback} />
              <input 
                className='btn btn-primary' 
                type='button' 
                value='Submit Mark' 
                onClick={() => this.props.submitGrade(this.state.points, this.state.outOf, this.state.feedback, this.props.mark.gradeId)} />
            </div>
          </span>
        </div>
      </div>
    )
  }
}

ResponseDisplay.propTypes = {
  studentName: PropTypes.string.isRequired,
  response: PropTypes.object,
  mark: PropTypes.object.isRequired,
  questionType: PropTypes.number.isRequired,
  submitGrade: PropTypes.func
}
