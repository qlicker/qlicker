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
      controls.push(<li><a href='#' onClick={(e) => this.wrapFunc(e, c.click)}>{c.label}</a></li>)
    })

    if (!this.props.controls) return ''
    return (
      <div className='btn-group dropup'>
        <button
          onClick={this.wrapFunc}
          type='button'
          className='btn btn-default dropdown-toggle'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'>
          More <span className='caret' />
        </button>
        <ul className='dropdown-menu'>
          {controls}
        </ul>
      </div>
    )
  }

}

ListItem.propTypes = {
  controls: PropTypes.array, // [ { click: func, label: String } ]
  click: PropTypes.func
}

