// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionStats.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import dl from 'datalib'
import { BarChart, Bar, XAxis, YAxis, Legend } from 'recharts'

import { Answers } from '../api/answers'
import { QUESTION_TYPE, TF_ORDER, MC_ORDER } from '../configs'

export class _AnswerDistribution extends Component {

  getRandomColor () {
    let letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)]
    }
    return color
  }

  render () {
    const colorSeq = ['#2FB0E8', '#FFC32A', '#27EE77', '#FF532A']
    const bars = []
    _(this.props.maxAttempt).times((i) => {
      const color = colorSeq[i] || this.getRandomColor()
      bars.push(<Bar dataKey={'attempt_' + (i + 1)} maxBarSize={45} fill={color} label isAnimationActive={false} />)
    })
    return (<div>
      <BarChart className='ql-answer-distribution'
        height={190} width={600} data={this.props.distribution}
        margin={{top: 10, right: 10, left: -25, bottom: 5}}>
        <XAxis dataKey='answer' />
        <YAxis allowDecimals={false} />
        <Legend />
        {bars}
      </BarChart>
    </div>)
  } //  end render

}

export const AnswerDistribution = createContainer((props) => {
  const handle = Meteor.subscribe('answers.forQuestion', props.question._id)
  const answers = Answers.find({ questionId: props.question._id }).fetch()

  const maxAttempt = props.question.sessionOptions.attempts.length
  const validOptions = _(props.question.options).pluck('answer')

  const data = []
  let options = _(dl.groupby('answer').execute(answers)).sortBy('answer')
  options.map((a) => {
    a.counts = _(dl.groupby('attempt').count().execute(a.values)).sortBy('attempt')
    delete a.values
  })
  options = _(options).indexBy('answer')

  validOptions.forEach((key) => {
    if (key in options) {
      const counts = _(options[key].counts).indexBy('attempt')
      _(maxAttempt).times((i) => {
        options[key]['attempt_' + (i + 1)] = counts[i + 1] ? counts[i + 1].count : 0
      })
    } else {
      _(maxAttempt).times((i) => {
        if (!(key in options)) options[key] = { answer: key }
        options[key]['attempt_' + (i + 1)] = 0
      })
    }
    data.push(options[key])
  })

  return {
    answers: answers,
    distribution: data,
    maxAttempt: maxAttempt,
    loading: !handle.ready()
  }
}, _AnswerDistribution)

AnswerDistribution.propTypes = {
  question: PropTypes.object.isRequired
}

