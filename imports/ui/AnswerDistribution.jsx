// QLICKER
// Author: Enoch T <me@enocht.am>
//
// AnswerDistribution.jsx

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'
//import { _ } from 'underscore'

import { BarChart, Bar, XAxis, YAxis, Legend } from 'recharts'

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
    if(!this.props.distribution || !this.props.distribution.length){
       return <div >No data</div>
    }

    _(this.props.maxAttempt).times((i) => {
      const color = colorSeq[i] || this.getRandomColor()
      const keyName = 'pct_attempt_' + (i + 1)
      const labelName = 'label_' + (i + 1)
      bars.push(<Bar key={i}
                     dataKey={keyName}
                     maxBarSize={45}
                     fill={color}
                     label={ {dataKey:labelName, stroke:color, strokeWidth:0.3, position:"top"} }
                     isAnimationActive={false} />)
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

export const AnswerDistribution = withTracker((props) => {
  const responseStats = props.responseStats
  const maxEntry = _(responseStats).max((s) => { return s.attempt })
  const maxAttempt = !(_.isEmpty(maxEntry)) ? maxEntry.attempt : 0
  // create the data for plotting, an array like:
  // [{answer:A, attempt_1:5, attempt_2:0}, {answer:B, attempt_1:8, attempt_2:3},... ]
  // (one object per answer)
  const answersByAttempt = _(responseStats).groupBy('answer')
  let distribution = []
  _(answersByAttempt).keys().forEach((answer) => {
    const responseStatsByAttempt = _(answersByAttempt[answer]).groupBy('attempt')
    let answerEntry = {}
    answerEntry[answer] = answer

    _(responseStatsByAttempt).keys().forEach((aNumber) => {
      answerEntry['attempt_' + aNumber] = responseStatsByAttempt[aNumber][0]['counts']
      answerEntry['pct_attempt_' + aNumber] = responseStatsByAttempt[aNumber][0]['pct']
      answerEntry['label_' + aNumber] = responseStatsByAttempt[aNumber][0]['pct']+'%'
    })
    distribution.push(answerEntry)
  })

  return {
    distribution: distribution,
    maxAttempt: maxAttempt
  }
})( _AnswerDistribution)

AnswerDistribution.propTypes = {
  question: PropTypes.object.isRequired,
  responseStats: PropTypes.array.isRequired// distribution of answers for displaying stats
}
