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
        unsavedChanges: false
      }
    } else this.state = {
      points: 0,
      feedback: '',
      showResponseView: false,
      unsavedChanges: false
    }

    this.saveGrade = this.saveGrade.bind(this)
    this.incrementResponse = this.incrementResponse.bind(this)
    this.updateFeedback = this.updateFeedback.bind(this)

  }

  componentDidMount () {
    if(this.props.mark && this.props.responses && this.props.responses.length > 0){
      const index = _(this.props.responses).findIndex((r) => {return r._id === this.props.mark.responseId})
      this.setState({ responseIndex: index })
    }
  }


  componentWillReceiveProps (nextProps) {
    const points = nextProps.mark ? nextProps.mark.points : 0
    const feedback = nextProps.mark && nextProps.mark.feedback ? nextProps.mark.feedback : ''
    const index =(nextProps.mark && nextProps.responses && nextProps.responses.length > 0) ?
                  _(nextProps.responses).findIndex((r) => {return r._id === nextProps.mark.responseId})
                  : -1
    this.setState({ points:points, feedback:feedback, responseIndex:index, unsavedChanges:false })

  }

  incrementResponse (increment) {
    const index = this.state.responseIndex + increment
    if (index >=0 && index < this.props.responses.length){
      this.setState({ responseIndex: index})
    }
  }

  saveGrade () {
    if(!this.props.mark || !this.props.gradeId || !this.state.unsavedChanges) return

    const points = Number(this.state.points)
    if (points > this.props.mark.outOf ) {
      alertify.error('Warning: assigning bonus points')
    }
    if (points < 0) {
      alertify.error('Error: negative points')
      return
    }

    let mark = this.props.mark
    mark.feedback = this.state.feedback
    mark.points = points
    mark.needsGrading = false
    Meteor.call('grades.updateMark', this.props.gradeId, mark, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Mark updated')
      this.setState({ unsavedChanges:false })
    })

    /*
    Meteor.call('grades.setMarkPoints', this.props.gradeId, this.props.mark.questionId, points, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Mark updated')
    })*/

  }

  updateFeedback (feedback) {
    const points = this.state.points
    const studentId = this.props.studentId
    const gradeId = this.props.gradeId
    const unsavedChanges = !(points === this.props.mark.points && feedback === this.props.mark.feedback)
    //TODO: Here and below, call the props to tell ResponseList that there are un-saved changes.
    
    //if(this.props.unsavedChanges) this.props.unsavedChanges()
    //console.log(feedback)
    this.setState({ feedback: feedback, unsavedChanges: unsavedChanges }, () => {
    //  console.log("setting")
      //console.log(this.state.feedback)
      //this.props.unsavedChanges()
    })

  }

  updatePoints (points) {
    const feedback = this.state.feedback
    const studentId = this.props.studentId
    const gradeId = this.props.gradeId
    const unsavedChanges = !(points === this.props.mark.points && feedback === this.props.mark.feedback)

    this.setState({ points: points, unsavedChanges: unsavedChanges }, ()=>{
      //this.props.unsavedChanges(unsavedChanges)
    })
  }

  render() {
    const outOf = this.props.mark ? this.props.mark.outOf : 0
    const setFeedback = (e) => this.updateFeedback(e.target.value)
    const setPoints = (e) => this.updatePoints(parseFloat(e.target.value))

    /*
    const setPoints = (e) => {
      const points = parseFloat(e.target.value)
      const feedback = this.state.feedback
      const unsavedChanges = !(points === this.props.mark.points && feedback === this.props.mark.feedback)

      this.setState({ points:points , unsavedChanges: unsavedChanges }, () =>{
        if(this.props.unsavedChanges){
          this.props.unsavedChanges(this.props.studentId, this.props.gradeId, points, this.state.feedback)
        }})
    }*/

    const toggleShowResponseView = () => this.setState({ showResponseView: !this.state.showResponseView })
    const nextResponse = () => this.incrementResponse(1)
    const prevResponse = () => this.incrementResponse(-1)

    const nResponses = this.props.responses.length
    const response = nResponses > 0  ? this.props.responses[this.state.responseIndex] : null
    //const attempt = response ? response.attempt : -1
    const showPrev = response && this.state.responseIndex > 0
    const showNext =  response && this.state.responseIndex < nResponses - 1

    if (this.state.showResponseView && response) return <ResponseViewModal response={response} done={toggleShowResponseView} />

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
              : ''
            }
          </div>

          <div className='grade'>
              <input type='number' className='numberField' min='0' max={100} step={0.5} value={this.state.points} onChange={setPoints} maxLength='4' size='4' />
              <span>/{outOf}</span>
          </div>
          <div className='feedback'>
            <textarea className='textField' value={this.state.feedback} onChange={setFeedback} />
          </div>
          <div className='save-button'>
            { this.state.unsavedChanges ?
              <button className='btn' type='button' onClick={this.saveGrade} > Save </button>
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
  responses: PropTypes.arrayOf(PropTypes.object),
  mark: PropTypes.object,
  questionType: PropTypes.number.isRequired,
  gradeId:PropTypes.string.isRequired,
  //submitGrade: PropTypes.func
}
