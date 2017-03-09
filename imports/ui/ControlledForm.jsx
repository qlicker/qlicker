// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ControlledForm.jsx: super class for controlled form components

import { Component, PropTypes } from 'react'

export class ControlledForm extends Component {

  constructor (props) {
    super(props)

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.done = this.done.bind(this)
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  done (e) {
    this.props.done()
  }

  preventPropagation (e) {
    e.stopPropagation()
  }

  handleSubmit (e) {
    e.preventDefault()
  }

} // end ControlledForm

ControlledForm.propTypes = {
  done: PropTypes.func.isRequired
}
