import React, { PropTypes, Component } from 'react'

import _ from 'underscore'

import { WysiwygHelper } from '../wysiwyg-helpers'

import { Grades } from '../api/grades'

import { EditGradeModal } from './modals/EditGradeModal'
import { EditFeedBackModal } from './modals/EditFeedBackModal'

export class ResponseDisplay extends Component {
  
  constructor(props) {
    super(props)

    this.state = {
      showGradeModal: false,
      showFeedbackModal: false
    }

    this.submitGrade = this.submitGrade.bind(this)

  }

  componentWillReceiveProps (nextProps) {
    this.setState({ points: nextProps.mark.points, outOf: nextProps.mark.outOf, feedback: nextProps.mark.feedback ? nextProps.mark.feedback : '' })
  }

  render() {
   
    const toggleGradeModal = () => this.setState({ showGradeModal: !this.state.showGradeModal })
    const toggleFeedbackModal = () => this.setState({ showFeedbackModal: !this.state.showFeedbackModal })
    const response = this.props.response ? this.props.response : null
    
    if (this.state.showGradeModal) return <EditGradeModal mark={this.props.mark} submit={this.submitGrade} done={toggleGradeModal}/>
    
    if (this.state.showFeedbackModal) return <EditFeedBackModal mark={this.props.mark} submit={this.submitGrade} done={toggleFeedbackModal}/>
    

    return(      
      <div className='response-card-container'>
        <div className='content'>
          <div className='name'><div className='centered'>{this.props.studentName}</div></div>
          <div className='answer'>
            {
              response
              ? this.props.questionType == 2
                ? <div className='textField' style={{'fontSize':'0.5em'}}>
                    {WysiwygHelper.htmlDiv(response.answerWysiwyg)}
                  </div>  
                : <div className='centered'><h4>{response.answer}</h4></div>
              : ''
            }
          </div>
          <div className='grade'>
            <div>
              {this.props.mark.points}/{this.props.mark.outOf}
              <span>&nbsp;</span>
              <span><a href="#" onClick={toggleGradeModal} style={{'fontSize':'0.5em'}}>Edit Grade</a></span>
            </div>
          </div>
          <div className='feedback'>
            <div className='textField'>{this.props.mark.feedback}</div>  
            <span>&nbsp;</span>
            <span><a href="#" onClick={toggleFeedbackModal}>Edit Feedback</a></span>                  
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
