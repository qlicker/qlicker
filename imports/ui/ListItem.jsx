// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ListItem.jsx: list item super class

import React, { Component, PropTypes } from 'react'

import '../api/courses.js'

/**
 * Listitem super class for various list items in Qlicker (Session, Question, Course)
 * @prop {Object[]} [controls] - array of more dropdown options to be displayed at right side of list item. [{ click: func, label: String }]
 * @prop {Func} [click] - list item click handler callback
 */
export class ListItem extends Component {

  constructor (props) {
    super(props)

    this.click = this.click.bind(this)
    this.controlClicked = this.controlClicked.bind(this)
    this.makeControls = this.makeControls.bind(this)
  }

  click () {
    if (this.props.click) this.props.click()
  }

  controlClicked (e) {
    e.preventDefault()
    e.stopPropagation()
    if (this.props.controlsTriggered) this.props.controlsTriggered()
  }

  wrapFunc (e, func) {
    e.preventDefault()
    e.stopPropagation()
    if (func) func()
  }

  makeControls () {
    const controls = []
    let divCount = 1
    ;(this.props.controls || []).forEach((c) => {
      divCount += 1
      if (c.divider) controls.push(<li key={'ctrl_' + divCount} role='separator' className='divider' >&nbsp;</li>)
      else controls.push(<li key={'ctrl_' + c.label}><a href='#' onClick={(e) => this.wrapFunc(e, c.click)}>{c.label}</a></li>)
    })

    if (!this.props.controls) return ''
    return (
      <div className='btn-group dropdown'>
        <div
          onClick={this.controlClicked}
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
