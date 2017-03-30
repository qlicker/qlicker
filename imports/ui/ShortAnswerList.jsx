// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ShortAnswerList.jsx: display list of short answer reponses for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Responses } from '../api/responses'

export class _ShortAnswerList extends Component {


  render () {
    return (<div>
      {JSON.stringify(this.props.responses)}
    </div>)
  } //  end render

}

export const ShortAnswerList = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const responses = Responses.find({ questionId: props.question._id }).fetch()

  return {
    responses: responses,
    loading: !handle.ready()
  }
}, _ShortAnswerList)

ShortAnswerList.propTypes = {
  question: PropTypes.object.isRequired
}

