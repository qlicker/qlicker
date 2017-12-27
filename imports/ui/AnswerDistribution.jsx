// QLICKER
// Author: Enoch T <me@enocht.am>
//
// AnswerDistribution.jsx

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { BarChart, Bar, XAxis, YAxis, Legend } from 'recharts'

import { Responses, responseDistribution } from '../api/responses'

/**
 * React Component (meteor reactive) for attempt distributions for a question
 * @prop {Question} question - question object
 */
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
      bars.push(<Bar key={i} dataKey={'pct_attempt_' + (i + 1)} maxBarSize={45} fill={color} label isAnimationActive={false} />)
    })
    return (<div className='ql-center-answer-distribution'>
      <BarChart className='ql-answer-distribution'
        height={190} width={500} data={this.props.distribution}
        margin={{top: 20, right: 10, left: -25, bottom: 5}}>
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

  const maxResponse = _(responses).max( (r) => {return r.attempt} )
  const maxAttempt = !(_.isEmpty(maxResponse)) ? maxResponse.attempt : 0

  const responseStats = responseDistribution(responses, props.question)
  // create the data for plotting, an array like:
  // [{answer:A, attempt_1:5, attempt_2:0}, {answer:B, attempt_1:8, attempt_2:3},... ]
  // (one object per answer)
  const answersByAttempt = _(responseStats).groupBy('answer')
  let distribution = []
  _(answersByAttempt).keys().forEach( (answer) => {
    const responseStatsByAttempt = _(answersByAttempt[answer]).groupBy('attempt')
    let answerEntry = {}
    answerEntry[answer]=answer

    _(responseStatsByAttempt).keys().forEach( (aNumber) => {
      answerEntry['attempt_' + aNumber] = responseStatsByAttempt[aNumber][0]['counts']
      answerEntry['pct_attempt_' + aNumber] = responseStatsByAttempt[aNumber][0]['pct']
    })
    distribution.push(answerEntry)
  })

  /*
  // Old
  // This is basically the same as in QuestionDisplay, with an extra loop over attempts
  //  const maxResponse = _(responses).max( (r) => {return r.attempt} )
  //  const maxAttempt = !(_.isEmpty(maxResponse)) ? maxResponse.attempt : 0
  const maxAttempt = props.question.sessionOptions ? props.question.sessionOptions.attempts.length : 0
  const validOptions = _(props.question.options).pluck('answer')
  let answerDistributionByAttempt = {}
  let totalByAttempt = {}
  for (let i = 0; i < maxAttempt; i++) {
    let attemptNumber = i + 1

    // Get the responses for that attempt:
    let responsesForAttempt = _(responses).where({ attempt:attemptNumber })
    // Get the total number of responses:
    let total = responsesForAttempt.length
    totalByAttempt[attemptNumber] = total
    // pull out all the answers from the responses, this gives an array of arrays of answers
    // e.g. [[A,B], [B], [B,C]], then flatten it
    let allAnswers = _(_(responsesForAttempt).pluck('answer')).flatten()
    // then we count each occurrence of answer in the array
    // we add a new key to answerDistribution if it that answer doesn't exist yet, or increment otherwise
    let answerDistribution = {}
    allAnswers.forEach((a) => {
      if (answerDistribution[a]) answerDistribution[a] += 1
      else answerDistribution[a] = 1
    })
    answerDistributionByAttempt[attemptNumber] = answerDistribution
  }
  // create the data for plotting, an array like:
  // [{answer:A, attempt_1:5, attempt_2:0}, {answer:B, attempt_1:8, attempt_2:3},... ]
  let formattedData = []
  validOptions.forEach((o) => {
    let answerEntry = { answer: o }
    for (let i = 0; i < maxAttempt; i++) {
      let attemptNumber = i + 1
      let answerDistribution = answerDistributionByAttempt[attemptNumber]
      let total = totalByAttempt[attemptNumber]

      if (!answerDistribution[o]) answerDistribution[o] = 0
      let pct = Math.round(100.0 * (total !== 0 ? answerDistribution[o] / total : 0))

      answerEntry['attempt_' + attemptNumber] = answerDistribution[o]
      answerEntry['pct_attempt_' + attemptNumber] = pct
    }
    formattedData.push(answerEntry)
  })
  console.log("Distribution/old")
  console.log(distribution)
  console.log(formattedData)
*/
  return {
    responses: responses,
    distribution: distribution,
    maxAttempt: maxAttempt, //probably not necessary...
    loading: !handle.ready()
  }
}, _AnswerDistribution)

AnswerDistribution.propTypes = {
  question: PropTypes.object.isRequired
}
