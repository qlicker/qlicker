import React, { PropTypes, Component } from 'react'

import _ from 'underscore'

import { WysiwygHelper } from '../wysiwyg-helpers'

export class ResponseDisplay extends Component {
  
  constructor(props) {
    super(props)

    this.state = {
      points: props.mark.points,
      outOf: props.mark.outOf,
      feedback: props.mark.feedback ? props.mark.feedback : ''
    }

  }

  componentWillReceiveProps (nextProps) {
    this.setState({ points: nextProps.mark.points, outOf: nextProps.mark.outOf, feedback: nextProps.mark.feedback ? nextProps.mark.feedback : '' })
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
          <div className='answer'>
            {
              response
              ? this.props.questionType == 2
                ? <div className='textField'>
                    {WysiwygHelper.htmlDiv(response.answerWysiwyg)}
                  </div>  
                : <div className='centered'><h4>{response.answer}</h4></div>
              : ''
            }
          </div>
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
