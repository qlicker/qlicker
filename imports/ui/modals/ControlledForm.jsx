// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ControlledForm.jsx: super class for controlled form components

import { Component } from 'react'

export class ControlledForm extends Component {

  constructor (props) {
    super(props)

    this.setValue = this.setValue.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  handleSubmit (e) {
    e.preventDefault()
  }

} // end ControlledForm
