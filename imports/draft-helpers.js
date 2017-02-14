// QLICKER
// Author: Enoch T <me@enocht.am>
//
// draft-helpers.js: helper methods for converted draft-js contents

import { convertFromRaw, convertToRaw, EditorState, convertFromHTML, ContentState } from 'draft-js'
import { stateToHTML } from 'draft-js-export-html'

const DraftHelper = {

  toEditorState: function (content) {
    if (typeof content === 'string') {
      const contentState = convertFromRaw(JSON.parse(content))
      const editorState = EditorState.createWithContent(contentState)
      return editorState
    } else return content
  },

  toHtml: function (content) {
    if (typeof content === 'string') {
      const contentState = convertFromRaw(JSON.parse(content))
      return stateToHTML(contentState)
    } else return stateToHTML(content)
  },

  toJson: function (content) {
    if (typeof content === 'object') {
      const contentState = content.getCurrentContent()
      return { json: JSON.stringify(convertToRaw(contentState)), plainText: contentState.getPlainText() }
    } else return content
  }

}

export { DraftHelper }
