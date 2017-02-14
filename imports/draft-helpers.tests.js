/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// draft-helpers.tests.js: tests for draft-js helper methods

import { expect } from 'meteor/practicalmeteor:chai'

import { convertFromRaw, convertToRaw, EditorState, convertFromHTML, ContentState } from 'draft-js'
import { stateToHTML } from 'draft-js-export-html'

import { DraftHelper } from './draft-helpers'

if (Meteor.isClient) {
  const createEditorState = () => {
    const initialQuestionState = ContentState.createFromBlockArray(convertFromHTML('<h2>Hello</h2>').contentBlocks)
    return EditorState.createWithContent(initialQuestionState)
  }

  describe('DraftHelper', () => {
    it('should convert JSON to EditorState (.toEditorState)', () => {
      const editorState = createEditorState()
      const { json } = DraftHelper.toJson(editorState)
      const newEditorState = DraftHelper.toEditorState(json)
      expect(newEditorState instanceof EditorState).to.be.true
    })
    it('should convert JSON to HTML (.toHtml)', () => {
      const editorState = createEditorState()
      const { json } = DraftHelper.toJson(editorState)
      const htmlString = DraftHelper.toHtml(json)
      expect(htmlString).to.contain('h2')
    })
    it('should convert EditorState to JSON (.toJson)', () => {
      const editorState = createEditorState()
      const { json, plainText } = DraftHelper.toJson(editorState)
      expect(plainText).to.equal('Hello')
      expect(json).to.contain('Hello')
    })
  })
}
