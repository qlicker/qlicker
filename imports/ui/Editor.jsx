/* global CKEDITOR */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Editor.jsx: react wrapper for ckeditor

import React, { Component } from 'react'

export class Editor extends Component {

  setupCKEditor () {
    CKEDITOR.plugins.addExternal('confighelper', '/ckeditor/plugins/confighelper/', 'plugin.js')

    const editor = CKEDITOR.inline(this.refs.theEditor, {
      placeholder: this.props.placeholder || '',
      customConfig: '/ckeditor/config.js'
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
