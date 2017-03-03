// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import dl from 'datalib'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'

import { Answers } from '../api/answers'


export class _AnswerDistribution extends Component {

  render () {
    return (<div>
      <BarChart
        width={400} height={200} data={this.props.distribution}
        margin={{top: 5, right: 0, left: -20, bottom: 5}}>
        <XAxis dataKey='answer' />
        <YAxis allowDecimals={false} />
        <Bar dataKey='count' fill='#2FB0E8' label isAnimationActive={false} />
      </BarChart>
    </div>)
  } //  end render

}


export const AnswerDistribution = createContainer((props) => {
  const handle = Meteor.subscribe('answers.forQuestion', props.question._id)

  const answers = Answers.find({ questionId: props.question._id, attempt: props.attempt }).fetch()
  const aggr = dl.groupby('answer').count().execute(answers)

  return {
    answers: answers,
    distribution: _(aggr).sortBy('answer'),
    loading: !handle.ready()
  }
}, _AnswerDistribution)

AnswerDistribution.propTypes = {
  question: PropTypes.object.isRequired,
  attempt: PropTypes.number.isRequired
}

