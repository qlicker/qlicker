/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ShortAnswerList.jsx

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

//import { WysiwygHelper } from '../wysiwyg-helpers'
import { Responses } from '../api/responses'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

/**
 * React component (meteor reactive) that displays a list of short answer reponses for a question
 * @prop {Question} question - question object
 */
class _HistogramNumerical extends Component {

  renderAnswer (r) {
    const user = Meteor.users.findOne(r.studentUserId)
    const name = user ? user.getName() : 'Unknown'
    const answer = r.answerWysiwyg ? WysiwygHelper.htmlDiv(r.answerWysiwyg) : r.answer

    return (
      <div>
        {name}: {answer}
      </div>
    )
  }
  componentDidMount () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }
  componentDidUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }
  render () {
    if (this.props.loading) return <div>Loading</div>

    return (
      <div>
        <div className='ql-short-answer-list'>
          <h3>Responses</h3>
          {
            this.props.responses.map(r => <div key={r._id} className='ql-short-answer-item'>{this.renderAnswer(r)}</div>)
          }
        </div>
        <div>
          <BarChart className='ql-answer-distribution'
            height={190} width={500} data={this.props.data} barCategoryGap={0}
            margin={{top: 20, right: 10, left: -25, bottom: 5}}>
            <XAxis dataKey='bin' />
            <YAxis allowDecimals={false} />
            <Legend />
            <Bar dataKey="counts" fill="#30B0E7" />
          </BarChart>
        </div>
      </div>
    )
  } //  end render

}

export const HistogramNumerical = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const question = props.question
  const attemptNumber = question.sessionOptions ? question.sessionOptions.attempts.length : 0
  // Get the responses for that attempt:
  const responses = Responses.find({ questionId: question._id, attempt: attemptNumber }, { sort: { createdAt: -1 } }).fetch()
  // Get the values into an array to be histogramed:
  //TODO swich to actual data!!
  const values = _(responses).pluck('answer').map(Number)
  //const values = [1,2,3,2,3,2,1,3,4,1,5,3,2,3,1,4,1,3,2,3,4,1]
  //Histogram the data
  const vmin = _(values).min()
  const vmax = _(values).max()
  const nvals = values.length
  let nbins = nvals > 50 ? 20 : 10
  let binWidth = nvals > 1 ? (vmax - vmin)/nbins : 1

  //Count the values in each bin (+1 bin to get the upper value)
  let counts = Array(nbins+1).fill(0)
  values.forEach( function (val) {
    let index = Math.round((val-vmin)/binWidth)
    counts[index]++
  })
  let data = []
  for(let i=0;i<nbins+1;i++){
    data.push({bin:vmin+i*0.5*binWidth,counts:counts[i]})
  }
  console.log(counts)
  console.log(data)

  return {
    responses: responses,
    loading: !handle.ready(),
    data: data
  }
}, _HistogramNumerical)

HistogramNumerical.propTypes = {
  question: PropTypes.object.isRequired
}
