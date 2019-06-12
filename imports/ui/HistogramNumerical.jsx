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
    console.log(this.props.edges)
    const xmin = this.props.edges[0]
    const xmax = parseFloat((this.props.edges.slice(-1)[0]).toPrecision(5)) //gets the last element
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
            <XAxis dataKey='bin'  type="number" interval='preserveStart' ticks={this.props.edges} domain={[xmin,xmax]} tickCount={this.props.edges.length} />
            <YAxis allowDecimals={false} label='counts' />
            <Tooltip />
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
  // Histogramming code:
  // Get the values into an array to be histogramed:
  const values = _(responses).pluck('answer').map(Number)
  //Upper limit on the number of bins in the hisogram based on entries:
  //this one could be passed as a prop, as well as a rebinning prop..
  const MAX_BINS = values.length < 200 ? 20 : 50
  //Calculate the binning assuming just a root(n) number of bins, then
  //clean things up to a "round" bin width, like 1, 0.5, 2
  let vmin = _(values).min()
  const vmax = _(values).max()
  const nvals = values.length
  let nbins = values.length > 1 ? Math.round(Math.sqrt(values.length)) : 1 // Should this be floor?
  if (nbins<2) nbins = 2
  let binWidth = nbins > 0 ? (vmax-vmin)/nbins : 1
  // Try to find a nice round bin width, either of width 0.1, 1, 10, 100
  // The power of 10 that is just smaller than current binwidth
  let power = Math.floor(Math.log10(binWidth))
  //Make that the bin width
  binWidth = Math.pow(10,power)
  //Now we also bring down the min value of the lowest bin to be a round number based on bin wdith
  vmin = Math.floor(vmin /binWidth)*binWidth
  nbins = Math.floor((vmax-vmin)/binWidth)+1

  //Finally, we lower the number of bins to be below MAX_BINS (if required)
  //allow a tolerance of 20% on moxbins!
  if(nbins > MAX_BINS) {
    const nbrecall = nbins
    let i = 0
    let factor = 1
    while(nbins > MAX_BINS){
      factor = 5 * Math.pow(10,i)
      nbins = nbrecall / factor
      i++
    }
    //factor = 2 * Math.pow(10,i-1)
    console.log(factor)
    nbins = Math.floor(nbrecall/factor) + 1
    binWidth *= factor
  }
  //Add an extra bin at the end, so that its low edge could be the max value
  nbins++
  //Now that the number of bins and the width is fixed, fill the bins!
  let counts = nbins > 0 ? Array(nbins).fill(0) : Array(1).fill(0)
  values.forEach( function (val) {
    let index = Math.floor((val-vmin)/binWidth)
    counts[index]++
  })
  let data = []
  let edges = [] //used to draw the x axis
  for(let i=0;i<nbins;i++){
    //need to strip round off error, like 0.10000000000000004
    edges.push(parseFloat((vmin+i*binWidth).toPrecision(10)))
    //for the data, we use the centre of the bin:
    data.push({bin:parseFloat((vmin+(i+0.5)*binWidth).toPrecision(10)),counts:counts[i]})
  }
  edges.push(vmin+nbins*binWidth)

  return {
    responses: responses,
    loading: !handle.ready(),
    data: data,
    edges:edges
  }
}, _HistogramNumerical)

HistogramNumerical.propTypes = {
  question: PropTypes.object.isRequired
}
