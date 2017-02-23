/* global CKEDITOR */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Editor.jsx: react wrapper for ckeditor

import React, { Component } from 'react'

export class Editor extends Component {

  setupCKEditor () {
    const editor = CKEDITOR.inline(this.refs.theEditor, {
      placeholder: this.props.placeholder || ''
    })
    editor.on('change', () => {
      this.props.change(editor.getData(), editor.editable().getText())
    })
  }

  componentDidMount () {
    this.setupCKEditor()
  }

  render () {
    const plchldr = this.props.placeholder || ''
    return (<div className={'editor-wrapper ' + this.props.className}>
      <textarea ref='theEditor' className='wysiwyg-editor' value={this.props.val} placeholder={plchldr} />
    </div>)
  } //  end render

} // end Editor
