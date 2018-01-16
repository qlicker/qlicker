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

// Whether or not a question can be auto-graded
export const isAutoGradeable = (type) => {
  switch (type) {
    case QUESTION_TYPE.MC:
      return true
    case QUESTION_TYPE.TF:
      return true
    case QUESTION_TYPE.SA: // 1 if any answer
      return false
    case QUESTION_TYPE.MS:
      return true
    default:
      return false
  }
}

export const QUESTION_TYPE_STRINGS = ['Multiple Choice', 'True/False', 'Short Answer', 'Multi Select']
export const QUESTION_TYPE_STRINGS_SHORT = ['MC', 'TF', 'SA', 'MS']

export const MC_ORDER = ['A', 'B', 'C', 'D', 'E', 'F']
export const TF_ORDER = ['TRUE', 'FALSE']
export const SA_ORDER = ['ANSWER']

export const SESSION_STATUS_STRINGS = {
  hidden: 'Draft',
  visible: 'Upcoming',
  running: '• Live',
  done: 'Finished'
}

export const formatDate = (date) => {
  var monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December'
  ]

  var day = date.getDate()
  var monthIndex = date.getMonth()
  var year = date.getFullYear()

  return monthNames[monthIndex] + ' ' + day + ', ' + year
}

export const ROLES = { // NOTE usage of constants is not fully implmented, some code still hardcodes role strings
  student: 'student',
  prof: 'professor',
  admin: 'admin'
}

export const userGuideUrl = 'https://qlicker.github.io'
