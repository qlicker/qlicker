import React, { PropTypes, Component } from 'react'

import _ from 'underscore'

import { WysiwygHelper } from '../wysiwyg-helpers'

import { ResponseViewModal } from './modals/ResponseViewModal'

export class ResponseDisplay extends Component {
  
  constructor(props) {
    super(props)

    if (props.mark) {
      this.state = {
        points: props.mark.points || 0,
        feedback: props.mark.feedback || '',
        showResponseView: false
      }
    } else this.state = {
      points: 0,
      feedback: '',
      showResponseView: false
    } 

    this.saveGrade = this.saveGrade.bind(this)

  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.mark) {
      this.setState({ points: nextProps.mark.points || 0, feedback: nextProps.mark.feedback || '' })  
    }
  }

  saveGrade () {
    
    const points = Number(this.state.points)
    if (points > this.props.mark.outOf || points < 0) {
      alertify.error('Error: Grade points out of range')
      return
    }

    let mark = this.props.mark
    mark = _.extend(mark, { feedback: this.state.feedback, points: points, needsGrading: false })

    Meteor.call('grades.updateMark', mark, (err) => {
      if (err) alertify.error(err)
      else alertify.success('Updated Mark')
    })
  }
  
  render() {
    const outOf = this.props.mark ? this.props.mark.outOf : 0
    const setFeedback = (e) => this.setState({ feedback: e.target.value })
    const setPoints = (e) => this.setState({ points: e.target.value })
    const toggleShowResponseView = () => this.setState({ showResponseView: !this.state.showResponseView })

    const response = this.props.response ? this.props.response : null

    if (this.state.showResponseView) return <ResponseViewModal response={this.props.response} done={toggleShowResponseView} />

    return(      
      <div className='response-card-container'>
        <div className='content'>
          <div className='name'><div className='centered'>{this.props.studentName}</div></div>
          <div className='answer'>
            {
              response
              ? this.props.questionType == 2
                ? <div className='textField' style={{'fontSize':'0.5em'}} onClick={toggleShowResponseView}>
                    {WysiwygHelper.htmlDiv(response.answerWysiwyg)}
                  </div>  
                : <div className='centered'><h4>{response.answer}</h4></div>
              : ''
            }
          </div>

          <div className='grade'>
              <input type='number' className='numberField' min='0' max={100} step={0.01} value={this.state.points} onChange={setPoints} maxLength='4' size='4' />
              <span>/{outOf}</span>
          </div>
          <div className='feedback'>
            <textarea className='textField' value={this.state.feedback} onChange={setFeedback} />              
          </div>
          <input className='btn' type='button' onClick={this.saveGrade} value='Save Mark' />
        </div>
      </div>
    )
  }
}

ResponseDisplay.propTypes = {
  studentName: PropTypes.string.isRequired,
  response: PropTypes.object,
  mark: PropTypes.object,
  questionType: PropTypes.number.isRequired,
  submitGrade: PropTypes.func
}
