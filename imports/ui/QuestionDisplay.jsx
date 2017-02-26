// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionDisplay.jsx: Component for displaying question in session

import React, { Component, PropTypes } from 'react'

export class QuestionDisplay extends Component {

  render () {
    return (<div>{ JSON.stringify(this.props.question) }</div>)
  } //  end render

}

QuestionDisplay.propTypes = {
  question: PropTypes.object.isRequired
}

