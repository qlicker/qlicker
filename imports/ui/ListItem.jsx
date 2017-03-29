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
      controls.push(<li key={'ctrl_' + c.label}><a href='#' onClick={(e) => this.wrapFunc(e, c.click)}>{c.label}</a></li>)
    })

    if (!this.props.controls) return ''
    return (
      <div className='btn-group dropdown'>
        <div
          onClick={this.wrapFunc}
          className='dropdown-toggle'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'>
          <span className='glyphicon glyphicon-option-vertical' />
        </div>
        <ul className='dropdown-menu dropdown-menu-right'>
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

