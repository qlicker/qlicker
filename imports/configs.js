// QLICKER
// Author: Enoch T <me@enocht.am>
//
// config.js: various constants

export const EDITOR_OPTIONS = {
  options: ['inline', 'fontSize', 'blockType', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'image'],
  list: { inDropdown: true, options: ['unordered', 'ordered'] },
  fontFamily: { options: ['Open Sans', 'Arial', 'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana', 'Courier New'] },
  textAlign: { inDropdown: true },
  inline: { inDropdown: true },
  blockType: { inDropdown: true, options: ['Normal', 'H1', 'H2', 'H3'] },
  link: { options: ['link'] }
}

export const QUESTION_TYPE = {
  MC: 0,
  TF: 1,
  SA: 2,
  MS: 3
}

export const QUESTION_TYPE_STRINGS = ['Multiple Choice', 'True/False', 'Short Answer', 'Multi Select']


export const MC_ORDER = ['A', 'B', 'C', 'D', 'E', 'F']
export const TF_ORDER = ['TRUE', 'FALSE']


export const SESSION_STATUS_STRINGS = {
  hidden: 'Draft',
  visible: 'Upcoming',
  running: 'Active',
  done: 'Inactive'
}
