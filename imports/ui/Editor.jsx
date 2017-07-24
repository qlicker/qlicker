/* global CKEDITOR */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Editor.jsx: react wrapper for ckeditor

import React, { Component } from 'react'
import { Slingshot } from 'meteor/edgee:slingshot'

/**
 * React component wrapper for CKEditor.
 * Note: This component is not fully controlled. Do not resuse component by setting a new props.val. Destroy and rebuild component if new props.val is set.
 * @prop {String} [placeholder] - textarea placeholder
 * @prop {String} val - component editor value
 * @prop {Func} change - onChange callback
 * @prop {String} className - class to append to top level dom element
 */
export class Editor extends Component {

  constructor (p) {
    super(p)

    this.fileURLs = []
    this.state = { val: this.props.val }
    this.editor = null
  }

  setupCKEditor () {
    CKEDITOR.plugins.addExternal('confighelper', '/ckeditor/plugins/confighelper/', 'plugin.js')
    CKEDITOR.plugins.addExternal('notification', '/ckeditor/plugins/notification/', 'plugin.js')
    CKEDITOR.plugins.addExternal('notificationaggregator', '/ckeditor/plugins/notificationaggregator/', 'plugin.js')
    CKEDITOR.plugins.addExternal('filetools', '/ckeditor/plugins/filetools/', 'plugin.js')
    CKEDITOR.plugins.addExternal('uploadwidget', '/ckeditor/plugins/uploadwidget/', 'plugin.js')
    CKEDITOR.plugins.addExternal('uploadimage', '/ckeditor/plugins/uploadimage/', 'plugin.js')
    CKEDITOR.plugins.addExternal('sharedspace', '/ckeditor/plugins/sharedspace/', 'plugin.js')
    CKEDITOR.plugins.addExternal('sourcedialog', '/ckeditor/plugins/sourcedialog/', 'plugin.js')

    // if (this.editor) {
    //   this.editor.destroy()
    //   this.editor = null
    // }

    this.editor = CKEDITOR.inline(this.refs.theEditor, {
      placeholder: this.props.placeholder || '',
      customConfig: '/ckeditor/config.js',
      extraPlugins: 'sharedspace,confighelper,mathjax,uploadwidget,uploadimage,sourcedialog',
      removePlugins: 'floatingspace,resize',
      sharedSpaces: {
        top: 'ckeditor-toolbar'
      }
    })

    this.editor.on('change', () => {
      this.props.change(this.editor.getData(), this.editor.editable().getText())
    })

    /* this.editor.on('fileUploadResponse', () => {
      console.log('FILE UPLOAD')
      setTimeout(() => {
        this.props.change(this.editor.getData(), this.editor.editable().getText())
      }, 200)
    }) */
  }

  componentDidMount () {
    this.setupCKEditor()
    this.componentDidUpdate()

    this.editor.on('fileUploadRequest', function (evt) {
      let upload = evt.data.requestData.upload
      let file = upload.file
      var reader = new FileReader()
      reader.readAsDataURL(file)
      evt.stop() // otherwise it will get automatically posted
      reader.addEventListener('loadend', function (e) {
        const fileURL = reader.result
        this.fileURLs.push(fileURL)
        let editor = this.editor
        var slingshotUpload = new Slingshot.Upload('QuestionImages')
        slingshotUpload.send(file, function (error, downloadUrl) {
          if (error) {
            console.error('Error uploading')
          } else {
            console.log('Success!')
            const img = '<img src=' + downloadUrl + ' />'
            editor.insertHtml(img)
          }
        })
      }.bind(this))
    }.bind(this))
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ val: nextProps.val })
  }

  componentDidUpdate () {
    // this.setupCKEditor()
    // if (this.editor) this.editor.setData(this.state.val)
  }

  render () {
    const plchldr = this.props.placeholder || ''
    return (<div className={'editor-wrapper ' + this.props.className}>
      <div className='ckeditor-wrapper'>
        <textarea ref='theEditor' className='wysiwyg-editor' value={this.state.val} placeholder={plchldr} />
      </div>
    </div>)
  } //  end render

} // end Editor
