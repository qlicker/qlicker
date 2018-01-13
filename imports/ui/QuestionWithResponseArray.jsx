// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// GradeViewModal

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { ControlledForm } from './ControlledForm'
import { QuestionDisplay } from './QuestionDisplay'

/**
 * Component to display questions and their responses for a given person
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
 //TODO: probably should not inherit from ControlledForm...

export class QuestionWithResponseArray extends Component {

  constructor (props) {
    super(props)
    const responseIndexToView = this.props.responses && this.props.responses.length > 0
      ? this.props.responses.length -1
      : 0
    this.state = {
      responseIndexToView : responseIndexToView
    }

    this.incrementResponse = this.incrementResponse.bind(this)
  }

  componentWillReceiveProps (nextProps){
    if ( (!this.props.question && nextProps.question) || (this.props.question._id !== nextProps.question._id) ){
      const responseIndexToView = nextProps.responses && nextProps.responses.length > 0
        ? nextProps.responses.length -1
        : 0
      this.setState ({ responseIndexToView : responseIndexToView })
    }
  }

  incrementResponse (index) {
    this.setState({ responseIndexToView: this.state.responseIndexToView + index })
  }

  render () {
    if (!this.props.question) return <div className='ql-subs-loading'>Loading</div>

    const response = this.props.responses && this.props.responses.length > 0
     ? this.props.responses[this.state.responseIndexToView]
     : null

    const prev = this.state.responseIndexToView - 1
    const next = this.state.responseIndexToView + 1

    const increment = () => this.incrementResponse(1)
    const decrement = () => this.incrementResponse(-1)

    return (
      <div className='ql-question-with-response-array'>
        { response
          ? <div className='ql-question-with-response-array-response-control'>
              <div className='ql-question-with-response-array-response-control-attempts'>
                Attempt: {response.attempt}
              </div>
              {this.props.responses.length > 1
                 ? <div className='btn-group btn-group-justified'>
                    <div className='btn-group'>
                      <button className='btn btn-default' onClick={decrement} disabled={prev < 0}>
                        <span className="glyphicon glyphicon-chevron-left"></span> Previous attempt
                      </button>
                    </div>
                    <div className='btn-group'>
                      <button className='btn btn-default' onClick={increment} disabled={next >= this.props.responses.length}>
                        Next attempt <span className="glyphicon glyphicon-chevron-right"></span>
                      </button>
                    </div>
                   </div>
                 : ''
              }
            </div>
          : ''
        }
        <div className='ql-question-with-response-array-question'>
          { this.props.prof
            ? <QuestionDisplay question={this.props.question} prof readonly forReview response={response} />
            : <QuestionDisplay question={this.props.question} readonly forReview response={response} />
          }
        </div>
      </div>
    )
  } //  end render

}

QuestionWithResponseArray.propTypes = {
  question: PropTypes.object,
  responses: PropTypes.array, // responses sorted by attempt number
  prof: PropTypes.bool, // passed to QuestionDisplay, to override showing correct
}
