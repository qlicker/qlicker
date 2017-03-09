// QLICKER
// Author: Enoch T <me@enocht.am>
//
// RadioPrompt.jsx: custom "radio button" style group of buttons

import React, { Component, PropTypes } from 'react'

export class RadioPrompt extends Component {

  constructor (props) {
    super(props)

    this.state = props

    this.clicked = this.clicked.bind(this)
  }

  clicked (value) {
    this.state.value = value
    this.props.onChange(value)
  }

  componentWillReceiveProps (nextProps) {
    this.setState(nextProps)
  }


  render () {
    return (
      <div className='ql-buttons-prompt'>
        {
          this.state.options.map((o) => {
            const classString =
              parseInt(o.value) === parseInt(this.state.value)
              ? 'prompt-selected' : ''

            return (
              <div
                key={'prompt-option-' + o.value}
                className={'ql-prompt-option ' + classString}
                onClick={() => { this.clicked(o.value) }}>
                {o.label}
              </div>)
          })
        }
      </div>

    )
  } //  end render

} // end RadioPrompt

RadioPrompt.propTypes = {
  options: PropTypes.array,
  value: PropTypes.number,
  onChange: PropTypes.func
}
