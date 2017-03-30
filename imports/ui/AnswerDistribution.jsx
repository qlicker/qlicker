// QLICKER
// Author: Enoch T <me@enocht.am>
//
// AnswerDistribution.jsx: Component for attempt distributions for a question

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import dl from 'datalib'
import { BarChart, Bar, XAxis, YAxis, Legend, text } from 'recharts'

import { Responses } from '../api/responses'

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
      bars.push(<Bar key={i} dataKey={'attempt_' + (i + 1)} maxBarSize={45} fill={color} label isAnimationActive={false} />)
    })
    return (<div>
      <BarChart className='ql-answer-distribution'
        height={190} width={500} data={this.props.distribution}
        margin={{top: 10, right: 10, left: -25, bottom: 5}}>
        <text x={250} y={20} textAnchor='middle' style={{fontWeight: 'bold'}}>{this.props.title || ''}</text>
        <XAxis dataKey='answer' />
        <YAxis allowDecimals={false} />
        <Legend />
        {bars}
      </BarChart>
      <div className='clear'>&nbsp;</div>
    </div>)
  } //  end render

}

export const AnswerDistribution = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const responses = Responses.find({ questionId: props.question._id }).fetch()

  const maxAttempt = props.question.sessionOptions.attempts.length
  const validOptions = _(props.question.options).pluck('answer')

  const data = []
  let options = _(dl.groupby('answer').execute(responses)).sortBy('answer')
  options.map((a) => {
    a.counts = _(dl.groupby('attempt').count().execute(a.values)).sortBy('attempt')
    delete a.values
  })
  const kOptions = _(options).indexBy('answer')

  // split up multi-select responses
  const arrayKeys = _(options).chain().pluck('answer').filter((k) => k instanceof Array).value()
  arrayKeys.forEach((k) => {
    k.forEach((j) => {
      kOptions[j] = _({}).extend(kOptions[k])
      kOptions[j].answer = j
    })
  })

  validOptions.forEach((key) => {
    if (key in kOptions) {
      const counts = _(kOptions[key].counts).indexBy('attempt')
      _(maxAttempt).times((i) => {
        kOptions[key]['attempt_' + (i + 1)] = counts[i + 1] ? counts[i + 1].count : 0
      })
    } else {
      _(maxAttempt).times((i) => {
        if (!(key in kOptions)) kOptions[key] = { answer: key }
        kOptions[key]['attempt_' + (i + 1)] = 0
      })
    }
    data.push(kOptions[key])
  })

  return {
    responses: responses,
    distribution: data,
    maxAttempt: maxAttempt,
    loading: !handle.ready()
  }
}, _AnswerDistribution)

AnswerDistribution.propTypes = {
  question: PropTypes.object.isRequired
}

