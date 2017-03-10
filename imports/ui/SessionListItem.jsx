/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { PropTypes } from 'react'

import { ListItem } from './ListItem'
import '../api/courses.js'
import { SESSION_STATUS_STRINGS } from '../configs'

export class SessionListItem extends ListItem {


  render () {
    const session = this.props.session
    const controls = this.makeControls()

    const status = session.status
    const strStatus = SESSION_STATUS_STRINGS[status]

    let completion = 0
    let index = 0
    let length = 0
    if (session.questions && session.currentQuestion) {
      length = session.questions.length
      index = session.questions.indexOf(session.currentQuestion)
      completion = ((index + 1) / length) * 100
    }
    return (
      <div className='ql-session-list-item' onClick={this.click}>
        <div className='row'>
          <div className='col-md-2'>
            <span className={'ql-session-status ' + ('ql-' + status)}>{strStatus} </span>
          </div>
          <div className={this.props.controls ? 'col-md-5' : 'col-md-6'}>
            <span className='ql-session-name'>{ session.name }</span>
            <span className='active-time'>{session.createdAt.toString()}</span>
          </div>
          <div className={this.props.controls ? 'col-md-3' : 'col-md-4'}>
            <span className='completion'>Question: {index + 1}/{length}</span>
            <div className='ql-progress'>
              <div className='ql-progress-bar' style={{ width: completion + '%' }}>&nbsp;</div>
            </div>
          </div>
          { this.props.controls
            ? <div className='col-md-2'>
              {controls}
            </div>
            : '' }
        </div>

      </div>)
  } //  end render

}

SessionListItem.propTypes = {
  session: PropTypes.object.isRequired,
  details: PropTypes.bool
}

