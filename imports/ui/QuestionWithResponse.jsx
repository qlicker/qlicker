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
  }

  render () {
    console.log("rendering")
    if (!this.props.question) return <div className='ql-subs-loading'>Loading</div>
    return (
      <div>
        <QuestionDisplay question={this.props.question} readonly forReview response={this.props.response ? this.prop.respsone: null} />
      </div>
    )
  } //  end render

}

QuestionWithResponse.propTypes = {
  question: PropTypes.object,
  response: PropTypes.object,
}
