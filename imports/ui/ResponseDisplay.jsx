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

    const response = this.props.response ? this.props.response : null
    
    return(
      <div className='response-card-container'>
        <h3 className='name'>{this.props.studentName}</h3>
        <div className='content'>
          {
            response
            ? this.props.questionType == 2
              ? <div className='answer'>
                  <div className='textField'>
                    {WysiwygHelper.htmlDiv(response.answerWysiwyg)}
                  </div>
                </div>
              : <div className='answer'>{response.answer}</div>
            : ''
          }
          
          <div className='grade'>
            <input value={this.state.points} type='text' onChange={setPoints} placeholder='Mark' />
            <div>Out Of</div>
            <input value={this.state.outOf} type='text' onChange={setOutOf} placeholder='Max Mark'/>
          </div>
          <div className='feedback'>
            <textarea className='textField' value={this.state.feedback} onChange={setFeedback} placeholder='Feedback:' />            
            <input 
              className='btn btn-primary' 
              type='button' 
              value='Submit Mark' 
              onClick={() => this.props.submitGrade(this.state.points, this.state.outOf, this.state.feedback, this.props.mark.gradeId)} />        
          </div>
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
