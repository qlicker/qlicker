
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
  SA: 2
}

export const MC_ORDER = ['A', 'B', 'C', 'D', 'E', 'F']
export const TF_ORDER = ['TRUE', 'FALSE']
