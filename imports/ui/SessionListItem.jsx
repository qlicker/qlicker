/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React, { PropTypes } from 'react'

import { ListItem } from './ListItem'
import '../api/courses.js'
import { SESSION_STATUS_STRINGS, formatDate } from '../configs'

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
      <div className='ql-session-list-item ql-list-item' onClick={this.click}>
        <div className='row'>
          <div className='col-md-2 col-xs-4 col-sm-3 status-col'>
            <span className={'ql-session-status ' + ('ql-' + status)}>{strStatus} </span>
          </div>
          <div className={this.props.controls ? 'col-md-6 col-sm-5 col-xs-8' : 'col-md-7 col-sm-6 col-xs-8'}>
            <span className='ql-session-name'>{ session.name }</span>
            <span>
              {session.date
                ? <span className='active-time'>
                  { formatDate(session.date) }
                </span>
               : ''}
              <span className='tags'>
                {session.tags && Meteor.user().hasRole('professor')
                  ? session.tags.map(t => <span key={t.value} className='ql-label ql-label-info'>{t.label}</span>)
                  : ''}
              </span>
            </span>
          </div>
          <div className={this.props.controls ? 'col-md-3 col-sm-2 hidden-xs' : 'col-md-4 col-sm-3 hidden-xs'}>
            <span className='completion'>Question: {index + 1}/{length}</span>
            <div className='ql-progress'>
              <div className='ql-progress-bar' style={{ width: completion + '%' }}>&nbsp;</div>
            </div>
          </div>
        </div>
        { this.props.controls ? <div className='controls'>{controls}</div> : '' }
      </div>)
  } //  end render

}

SessionListItem.propTypes = {
  session: PropTypes.object.isRequired,
  details: PropTypes.bool
}

