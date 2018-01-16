// QLICKER
// Author: Enoch T <me@enocht.am>
//
// RadioPrompt.jsx

import React, { Component, PropTypes } from 'react'

export class Dropdown extends Component {

  render () {
    return (
      <div className='dropdown'>
        <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
          {this.props.title}
          <span className='caret' />
        </a>
        <ul className='dropdown-menu'>
          {this.props.options.map((option) => {
            return (<li key={option.name}><a onClick={option.click}>{option.name}</a></li>)
          })}
        </ul>
      </div>
    )
  } //  end render

} // end RadioPrompt

Dropdown.propTypes = {
  options: PropTypes.array, // [ {name, click}, {name, click}, ... ]
  title: PropTypes.string
}
