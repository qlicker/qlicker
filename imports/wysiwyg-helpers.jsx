// QLICKER
// Author: Enoch T <me@enocht.am>
//
// wysiwyg-helpers.js: helper methods for displaying html contents from editors

import React from 'react'

const WysiwygHelper = {

  htmlDiv: function (content) {
    return (<div dangerouslySetInnerHTML={{ __html: content }} />)
  }

}

export { WysiwygHelper }
