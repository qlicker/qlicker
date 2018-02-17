// QLICKER
// Author: Viraj Bangari
//
// A general purpose drag and drop component.

import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import Dropzone from 'dropzone'

export class DragAndDropArea extends Component {

  render () {
    return (
        this.props.children
    )
  }

  componentDidMount () {
    // Dropzone is a JS library that implements dragging and
    // dropping. A callback is called to a bound DOM node. By
    // using ReactDOM.findDOMNode(this), a reference to the
    // rendered DOM node is bound.
    this.dropzone = new Dropzone(ReactDOM.findDOMNode(this), {
      url: this.props.url || '/dummy/url/to/send/post',
      acceptedFiles: this.props.acceptedFiles || 'image/jpeg,image/png,image/gif',
      accept: this.props.onDrop
    })
  }

}

DragAndDropArea.propTypes = {
  onDrop: PropTypes.func,
  url: PropTypes.string,
  acceptedFiles: PropTypes.string
}
