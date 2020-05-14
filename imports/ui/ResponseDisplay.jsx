import React, { Component } from 'react'
import PropTypes from 'prop-types'

import _ from 'underscore'

import { WysiwygHelper } from '../wysiwyg-helpers'

import { ResponseViewModal } from './modals/ResponseViewModal'

export class ResponseDisplay extends Component {

  constructor(props) {
    super(props)

    this.state = {
      showResponseView: false,
      feedback: '',
    }
    this.setFeedback = this.setFeedback.bind(this)
    this.updateFeedback = this.updateFeedback.bind(this)
    this._DB_updateFeedback =  _.debounce(this.updateFeedback, 500)
    this.incrementResponse = this.incrementResponse.bind(this)

  }

  componentDidMount () {
    let index = 0
    if(this.props.mark && this.props.responses && this.props.responses.length > 0){
     index = _(this.props.responses).findIndex((r) => {return r._id === this.props.mark.responseId})
    }
    const feedback = this.props.feedback
    this.setState({ responseIndex: index, feedback:feedback })
  }


  componentWillReceiveProps (nextProps) {
    const index =(nextProps.mark && nextProps.responses && nextProps.responses.length > 0) ?
                  _(nextProps.responses).findIndex((r) => {return r._id === nextProps.mark.responseId})
                  : -1

    const feedback = nextProps.feedback
    this.setState({ responseIndex:index, feedback:feedback })

  }

  updateFeedback(text) {
    this.props.updateFeedback(this.props.studentId, text)
  }

  setFeedback (e) {
    this.setState({ feedback: e.target.value})
    this._DB_updateFeedback(e.target.value)
  }

  incrementResponse (increment) {
    const index = this.state.responseIndex + increment
    if (index >=0 && index < this.props.responses.length){
      this.setState({ responseIndex: index})
    }
  }


  render() {
    const outOf = this.props.mark ? this.props.mark.outOf : 0
    /*const setFeedback = (e) =>{
       this.setState({ feedback: e.target.value})
       _.debounce(this.props.updateFeedback(this.props.studentId, e.target.value),500)
     }*/
    const setPoints = (e) => this.props.updatePoints(this.props.studentId, parseFloat(e.target.value))
    const saveGrade = this.props.saveGrade ? () => this.props.saveGrade(this.props.studentId) : undefined
    const cancelChange = this.props.cancelChange ? () => this.props.cancelChange(this.props.studentId) : undefined

    const toggleShowResponseView = () => this.setState({ showResponseView: !this.state.showResponseView })
    const nextResponse = () => this.incrementResponse(1)
    const prevResponse = () => this.incrementResponse(-1)

    const nResponses = this.props.responses.length
    const response = nResponses > 0  ? this.props.responses[this.state.responseIndex] : null
    //const attempt = response ? response.attempt : -1
    const showPrev = response && this.state.responseIndex > 0
    const showNext =  response && this.state.responseIndex < nResponses - 1



    if (this.state.showResponseView && response) return(
       <ResponseViewModal
          studentName={this.props.studentName}
          studentId={this.props.studentId}
          points={this.props.points}
          feedback={this.state.feedback}
          updateFeedback={this.props.updateFeedback}
          updatePoints={this.props.updatePoints}
          saveGrade={this.props.saveGrade}
          cancelChange={this.props.cancelChange}
          mark={this.props.mark}
          response={response}
          done={toggleShowResponseView} />)

    return(
      <div className='ql-response-display'>
        <div className='ql-response-display-flex'>
          <div className='name'>{this.props.studentName}</div>
          <div className='answer-attempts'>
            { response ?
                <div className='answer'>
                  { nResponses > 1 ?
                    <div className='attempt-control'>
                      { showPrev ?
                          <div className='button' onClick={prevResponse} >
                            <span className='glyphicon glyphicon-chevron-left' />
                          </div>
                        : ''
                      }
                    </div>
                    : ''
                  }
                  {this.props.questionType == 2 ?
                      <div className='satype' onClick={toggleShowResponseView}>
                        { WysiwygHelper.htmlDiv(response.answerWysiwyg) }
                      </div>
                    : <div className='mctype'>{response.answer}</div>
                  }
                  { nResponses > 1 ?
                    <div className='attempt-control'>
                      { showNext ?
                          <div className='button' onClick={nextResponse} >
                            <span className='glyphicon glyphicon-chevron-right' />
                          </div>
                        : ''
                      }
                    </div>
                    : ''
                  }

                </div>
              : <div className='answer'><div className='mctype'>no response</div></div>
            }
          </div>

          <div className='grade'>
              <input type='number' className='numberField' min={0} max={100} step={0.5} value={this.props.points} onChange={setPoints} maxLength='4' size='4' />
              <span>&nbsp;/{outOf}</span>
          </div>
          <div className='feedback'>
            <textarea className='textField' value={this.state.feedback} onChange={this.setFeedback} />
          </div>
          <div className='save-button'>
            { saveGrade ?
              <div className='btn-group-vertical'>
                <button className='btn' type='button' onClick={saveGrade} > Save </button>
                <button className='btn' type='button' onClick={cancelChange} > Cancel </button>
              </div>
              : ''
            }
          </div>
        </div>
      </div>
    )
  }
}

ResponseDisplay.propTypes = {
  studentName: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  responses: PropTypes.arrayOf(PropTypes.object),
  mark: PropTypes.object,
  questionType: PropTypes.number.isRequired,
  points : PropTypes.number.isRequired,
  feedback : PropTypes.string,
  saveGrade : PropTypes.func,
  cancelChange : PropTypes.func,
  updateFeedback : PropTypes.func.isRequired,
  updatePoints : PropTypes.func.isRequired,
}
