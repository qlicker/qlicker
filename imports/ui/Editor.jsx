/* global CKEDITOR */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Editor.jsx: react wrapper for ckeditor

import React, { Component } from 'react'
import { Slingshot } from 'meteor/edgee:slingshot'
import { Images } from '../api/images'

let UUID = require('uuid-1345')

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

    this.state = { val: this.props.val }
    this.editor = null
    this.addImage = this.addImage.bind(this)
    this.resizeImage = this.resizeImage.bind(this)
  }

  setupCKEditor () {
    CKEDITOR.plugins.addExternal('confighelper', '/ckeditor/plugins/confighelper/', 'plugin.js')
    CKEDITOR.plugins.addExternal('notification', '/ckeditor/plugins/notification/', 'plugin.js')
    CKEDITOR.plugins.addExternal('notificationaggregator', '/ckeditor/plugins/notificationaggregator/', 'plugin.js')
    CKEDITOR.plugins.addExternal('filetools', '/ckeditor/plugins/filetools/', 'plugin.js')
    CKEDITOR.plugins.addExternal('image2', '/ckeditor/plugins/image2/', 'plugin.js')
    CKEDITOR.plugins.addExternal('mathjax', '/ckeditor/plugins/mathjax/', 'plugin.js')
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
      extraPlugins: 'sharedspace,confighelper,mathjax,uploadwidget,uploadimage,sourcedialog,image2',
      removePlugins: 'floatingspace,resize',
      // startupFocus: true, // TODO: Check if this is effective - also added this in the config file...
      sharedSpaces: {
        top: this.props.toolbarDivId || 'ckeditor-toolbar'
      }
    })

    this.editor.on('change', () => {
      this.props.change(this.editor.getData(), this.editor.editable().getText())
    })
  }

  addImage (image) {
    var element = this.editor.document.createElement('img')
    this.editor.insertElement(element)
    this.editor.widgets.initOn(element, 'image', {src: image.url + '/image'})
    Meteor.call('images.insert', image, (e) => {
      if (e) return alertify.error('Error updating image')
    })
  }

  resizeImage (size, img, meta, save) {
    let width = img.width
    let height = img.height
    if (width > size) {
      width = size
      height = size * img.height / img.width
    }
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    let slingshotThumbnail = new Slingshot.Upload('QuestionImages', meta)
    canvas.toBlob((blob) => {
      slingshotThumbnail.send(blob, (e, downloadUrl) => {
        if (e) alertify.error('Error uploading')
        else if (save) {
          img.url = downloadUrl.slice(0, -(meta.type.length + 1))
          img.UID = meta.UID
          this.addImage(img)
        }
      })
    })
  }

  componentDidMount () {
    this.setupCKEditor()
    this.componentDidUpdate()

    this.editor.on('fileUploadRequest', function (evt) {
      let upload = evt.data.requestData.upload
      let file = upload.file
      let reader = new window.FileReader()
      reader.readAsDataURL(file)
      evt.stop()
      reader.addEventListener('loadend', function (e) {
        const fileURL = reader.result
        const UID = UUID.v5({
          namespace: '00000000-0000-0000-0000-000000000000',
          name: fileURL})
        let image = {UID: UID}
        const existing = Images.find(image).fetch()[0]
        if (existing) this.addImage(existing)
        else {
          let img = new window.Image()
          img.onload = function () {
            const meta = {UID: UID, type: 'image'}
            Meteor.call('settings.find', (e, obj) => {
              if (obj) this.resizeImage(obj.maxImageWidth, img, meta, true)
            })
          }.bind(this)
          img.src = fileURL

          // Makes a thumbnail
          let thumb = new window.Image()
          thumb.onload = function () {
            const meta = {UID: UID, type: 'thumbnail'}
            this.resizeImage(50, thumb, meta, false)
          }.bind(this)
          thumb.src = e.target.result
        }
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
        <textarea ref='theEditor' className='wysiwyg-editor' defaultValue={this.state.val || ''} placeholder={plchldr} />
      </div>
    </div>)
  } //  end render

} // end Editor
