/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ShortAnswerList.jsx

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

/**
 * React component (meteor reactive) that displays a list of short answer reponses for a question
 * @prop {Question} question - question object
 */
export class Histogram extends Component {
  constructor (props) {
    super(props)
    this.state={
      data: [],
      binEdges: [],
    }
    this.fillHistogram = this.fillHistogram.bind(this)
  }
  componentDidMount () {
    this.fillHistogram()
  }
  componentDidUpdate (nextProps) {
    if (nextProps.values.length != this.props.values.length || nextProps.max_bins != this.props.max_bins){
      this.fillHistogram()
    }
  }

  fillHistogram() {
    const values = this.props.values
    if (values.length <1 ){
      this.setState({data:[], binEdges:[]})
      return
    }
    //Upper limit on the number of bins in the hisogram based on entries:
    //this one could be passed as a prop, as well as a rebinning prop..
    const MAX_BINS = this.props.max_bins ? this.props.max_bins : (values.length < 200 ? 20 : 50)
    //Calculate the binning assuming just a root(n) number of bins, then
    //clean things up to a "round" bin width, like 1, 0.5, 2
    let vmin = _(values).min()
    const vmax = _(values).max()
    const nvals = values.length
    let nbins = values.length > 1 ? Math.floor(Math.sqrt(values.length)) + 1 : 2 // Should this be floor?
    //if (nbins<2) nbins = 2
    let binWidth = (vmax-vmin) > 0 ? (vmax-vmin)/nbins : 1
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
      nbins = Math.floor(nbrecall/factor) + 1
      binWidth *= factor
    }
    //Add an extra bin at the end, so that its low edge could be the max value
    nbins++
    //console.log(nbins+" "+vmin+" "+binWidth)
      //Now that the number of bins and the width is fixed, fill the bins!
    let counts = nbins > 0 ? Array(nbins).fill(0) : Array(1).fill(0)
    values.forEach( function (val) {
      let index = Math.floor((val-vmin)/binWidth)
      if(index >= 0 && index < nbins ) counts[index]++
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
    this.setState({data:data, binEdges:edges})
  }

  render () {
    if (this.props.values.length < 1 || this.state.data.length < 1){
      return <div className='ql-subs-loading'>No values to display</div>
    }
    const xmin = this.state.binEdges[0]
    const xmax = parseFloat(( this.state.binEdges.slice(-1)[0]).toPrecision(5)) //gets the last element
    return (
      <BarChart className='ql-histogram-container'
        height={190} width={this.props.width || 500} data={this.state.data} barCategoryGap={0}
        margin={{top: 20, right: 10, left: -25, bottom: 5}}>
        <XAxis dataKey='bin'  type="number" interval='preserveStart' ticks={this.state.binEdges} domain={[xmin,xmax]} tickCount={this.state.binEdges.length} />
        <YAxis allowDecimals={false} label='counts' />
        <Tooltip />
        <Bar dataKey="counts" fill="#30B0E7" />
      </BarChart>
    )
  } //  end render

}

Histogram.propTypes = {
  values: PropTypes.array.isRequired,
  max_bins: PropTypes.number,
  width: PropTypes.number,
}
