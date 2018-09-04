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
        showResponseView: false,
        responseIndex: this.props.responses.length - 1
      }
    } else this.state = {
      points: 0,
      feedback: '',
      showResponseView: false,
      responseIndex: -1
    }

    this.saveGrade = this.saveGrade.bind(this)
    this.incrementResponse = this.incrementResponse.bind(this)

  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.mark) {
      this.setState({ points: nextProps.mark.points || 0, feedback: nextProps.mark.feedback || '' })
    }
  }

  incrementResponse (increment) {
    const index = this.state.responseIndex + increment
    if (index >=0 && index < this.props.responses.length){
      this.setState({ responseIndex: index})
    }
  }

  saveGrade () {

    const points = Number(this.state.points)
    if (points > this.props.mark.outOf ) {
      alertify.error('Warning: assigning bonus points')
    }
    if (points < 0) {
      alertify.error('Error: negative points')
      return
    }
    Meteor.call('grades.setMarkPoints', this.props.gradeId, this.props.mark.questionId, points, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Mark updated')
    })
    /*
    let mark = this.props.mark
    mark = _.extend(mark, { feedback: this.state.feedback, points: points, needsGrading: false })

    Meteor.call('grades.updateMark', mark, (err) => {
      if (err) alertify.error(err)
      else alertify.success('Updated Mark')
    })*/
  }

  render() {
    const outOf = this.props.mark ? this.props.mark.outOf : 0
    const setFeedback = (e) => this.setState({ feedback: e.target.value })
    const setPoints = (e) => this.setState({ points: e.target.value })
    const toggleShowResponseView = () => this.setState({ showResponseView: !this.state.showResponseView })
    const nextResponse = () => this.incrementResponse(1)
    const prevResponse = () => this.incrementResponse(-1)

    const nResponses = this.props.responses.length
    const response = nResponses > 0  ? this.props.responses[this.state.responseIndex] : null
    //const attempt = response ? response.attempt : -1
    const showPrev = response && this.state.responseIndex > 0
    const showNext =  response && this.state.responseIndex < nResponses - 1

    if (this.state.showResponseView) return <ResponseViewModal response={this.props.response} done={toggleShowResponseView} />

    return(
      <div className='ql-response-display'>
        <div className='ql-response-display-flex'>
          <div className='name'>{this.props.studentName}</div>
          <div className='answer-attempts'>
            { response ?
                <div className='answer'>

                  { nResponses > 1 ?
                      <div className='button' onClick={prevResponse}>
                        { showPrev ? <span className='glyphicon glyphicon-chevron-left' /> : '' }
                      </div>
                      : ''
                  }
                  {this.props.questionType == 2 ?
                      <div className='satype' onClick={toggleShowResponseView}>
                        { WysiwygHelper.htmlDiv(response.answerWysiwyg) }
                      </div>
                    : <div className='mctype'>{response.answer}</div>
                  }
                  {  nResponses > 1 ?
                      <div className='button' onClick={nextResponse}>
                        { showNext ? <span className='glyphicon glyphicon-chevron-right' /> : ''}
                      </div>
                      : ''
                  }

                </div>
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
          <input className='btn' type='button' onClick={this.saveGrade} value='Save' />
        </div>
      </div>
    )
  }
}

ResponseDisplay.propTypes = {
  studentName: PropTypes.string.isRequired,
  responses: PropTypes.arrayOf(PropTypes.object),
  mark: PropTypes.object,
  questionType: PropTypes.number.isRequired,
  gradeId:PropTypes.string.isRequired,
  //submitGrade: PropTypes.func
}
