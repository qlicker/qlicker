// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ListItem.jsx: list item super class

import React, { Component, PropTypes } from 'react'

import '../api/courses.js'

export class ListItem extends Component {

  constructor (props) {
    super(props)

    this.click = this.click.bind(this)
    this.makeControls = this.makeControls.bind(this)
  }

  click () {
    if (this.props.click) this.props.click()
  }

  wrapFunc (e, func) {
    e.preventDefault()
    e.stopPropagation()
    if (func) func()
  }

  makeControls () {
    const controls = []
    ;(this.props.controls || []).forEach((c) => {
      controls.push(<button className='btn btn-default' onClick={(e) => this.wrapFunc(e, c.click)}>{c.label}</button>)
    })
  }

}

ListItem.propTypes = {
  controls: PropTypes.array, // [ { click: func, label: String } ]
  click: PropTypes.func
}

