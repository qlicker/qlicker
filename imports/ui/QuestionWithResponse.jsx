// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// GradeViewModal

import React, { PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { ControlledForm } from './ControlledForm'
import { QuestionDisplay } from './QuestionDisplay'

/**
 * Component to display questions and their responses for a given person
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
 //TODO: probably should not inherit from ControlledForm...

export class QuestionWithResponse extends ControlledForm {

  constructor (props) {
    super(props)
    const responseToView = this.props.responses.length > 0
      ? this.props.responses.length -1
      : 0
    this.state = {
      responseToView : responseToView
    }

    this.incrementResponse = this.incrementResponse.bind(this)
  }

  componentWillReceiveProps (nextProps){
    if (this.props.question._id !== nextProps.questionId){
      const responseToView = nextProps.responses.length > 0
        ? nextProps.responses.length -1
        : 0
      this.setState ({responseToView : responseToView})
    }
  }

  incrementResponse (index) {
    this.setState({ responseToView: this.state.responseToView + index })
  }

  render () {
    if (!this.props.question) return <div className='ql-subs-loading'>Loading</div>

    const response = this.props.responses.length > 0
     ? this.props.responses[this.state.responseToView]
     : null

    const prev = this.state.responseToView - 1
    const next = this.state.responseToView + 1

    const increment = () => this.incrementResponse(1)
    const decrement = () => this.incrementResponse(-1)

    return (
      <div>
        { response
          ? <div>
              Attempt: {response.attempt}
              {this.props.responses.length > 1
                 ? <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                   { prev > -1
                     ? <a className='btn btn-default' onClick={decrement}>Previous attempt</a>
                     : ''
                   }
                   { next < this.props.responses.length
                     ? <a className='btn btn-default' onClick={increment}>Next attempt</a>
                     : ''
                   }
                   </div>
                 : ''
              }
            </div>
          : ''
        }
        <QuestionDisplay question={this.props.question} readonly forReview response={response} />
      </div>
    )
  } //  end render

}

QuestionWithResponse.propTypes = {
  question: PropTypes.object,
  responses: PropTypes.array, // responses sorted by attempt number
}
