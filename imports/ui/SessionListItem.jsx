/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// SessionListItem.jsx

import React, { PropTypes } from 'react'

import { ListItem } from './ListItem'

import moment from 'moment-timezone'

import { SESSION_STATUS_STRINGS } from '../configs'

/**
 * React component list item for each session.
 * typically used in course page and embedded in StudentCourseComponent.
 * @class
 * @augments ListItem
 * @prop {Session} session - session object
 * @prop {Func} [click] - list item click handler
 */
export class SessionListItem extends ListItem {
  toggleReview (evt) {
    evt.stopPropagation()
    const sessionId = this.props.session._id
    Meteor.call('sessions.toggleReviewable', sessionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        const status = this.props.session.reviewable ? 'enabled' : 'disabled'
        alertify.success('Review ' + status)
      }
    })
  }

  reviewSession (evt) {
    evt.stopPropagation()
    const sessionId = this.props.session._id
    Router.go('session.results', { sessionId: sessionId, courseId: this.props.session.courseId  })
  }

  render () {
    const session = this.props.session
    const controls = this.makeControls()
    const currentTime = Date.now()
    let status = session.status
    if(session.quizIsActive() ){
      status = 'running'
    }
    if(session.quiz && session.status === 'visible' && session.quizEnd && currentTime > session.quizEnd ) {
      status = 'done'
    }

    const strStatus = SESSION_STATUS_STRINGS[status]

    const strAllowReview = this.props.session.reviewable ? 'Disable Review' : 'Allow Review'

    let completion = 0
    let index = 0
    let length = 0
    if (session.questions && session.currentQuestion) {
      length = session.questions.length
      index = session.questions.indexOf(session.currentQuestion)
      completion = ((index + 1) / length) * 100
    }
    let link = ''
    if (Meteor.user().isInstructor(session.courseId) && session.status === 'done') {
      link = <a href='#' className='toolbar-button' onClick={(evt) => this.toggleReview(evt)}>{strAllowReview}</a>
    } else if (Meteor.user().hasRole('student') && session.reviewable && session.status === 'done') {
      link = <a href='#' className='toolbar-button' onClick={(evt) => this.reviewSession(evt)}>Review</a>
    } else {}

    let statusClassName = 'ql-session-status ' + ('ql-' + status)
    //if (session.reviewable && session.status === 'done') statusClassName += ' reviewable'
    //if (!session.reviewable && session.status === 'done') statusClassName += ' not-reviewable'

    let showTime = session.date || session.quizStart || session.quizEnd
    let timeString = moment(session.date).format('MMMM DD, YYYY')
    if (session.quiz){
      if (session.quizStart && currentTime < session.quizStart){
        timeString = 'Opens at '+moment(session.quizStart).format('hh:mm A') +' on '+moment(session.quizStart).format('dddd MMMM DD, YYYY')
      }
      else if  (session.quizStart && currentTime > session.quizStart && session.quizEnd && currentTime < session.quizEnd){
        timeString = 'Closes at '+moment(session.quizEnd).format('hh:mm A') +' on '+moment(session.quizEnd).format('dddd MMMM DD, YYYY')
      }
      else if (session.quizEnd && currentTime < session.quizEnd){
        timeString = 'Closes at '+moment(session.quizEnd).format('hh:mm A') +' on '+moment(session.quizEnd).format('dddd MMMM DD, YYYY')
      }
      else if (session.quizEnd){
        timeString = 'Closed at '+moment(session.quizEnd).format('hh:mm A') +' on '+moment(session.quizEnd).format('dddd MMMM DD, YYYY')
      }
      else{}
    }

    return (
      <div className='ql-session-list-item ql-list-item' onClick={this.props.click}>
        <div className='row'>
          <div className='col-md-2 col-xs-4 col-sm-3 status-col'>
            <span className={statusClassName}>{strStatus} </span>
          </div>
          <div className={this.props.controls ? 'col-md-6 col-sm-5 col-xs-8' : 'col-md-7 col-sm-6 col-xs-8'}>
            <span className='ql-session-name'>{ session.name }</span>
            <span>
              {showTime
                ? <span className='active-time'>
                  {timeString}
                </span>
               : '' }
              <span className='tags'>
                {session.tags && Meteor.user().hasRole('professor')
                  ? session.tags.map(t => <span key={t.value} className='ql-label ql-label-info'>{t.label}</span>)
                  : ''}
              </span>
            </span>
          </div>
          <div className='col-md-2 col-xs-4 col-sm-3'>
            {link}
          </div>
          { /*this.props.participation ?
            //This used to show what the current question is, better to show the grade...
            <div className={this.props.controls ? 'col-md-3 col-sm-2 hidden-xs' : 'col-md-4 col-sm-3 hidden-xs'}>
            <span className='completion'>Participation: {this.props.participation} </span>
            <div className='ql-progress'>
              <div className='ql-progress-bar' style={{ width: this.props.participation + '%' }}>&nbsp;</div>
            </div>
          </div>
          : ''*/
         }
        </div>
        { this.props.controls ? <div className='controls'>{controls}</div> : '' }
      </div>)
  } //  end render

}

SessionListItem.propTypes = {
  session: PropTypes.object.isRequired,
  details: PropTypes.bool,
  participation: PropTypes.number,
  click: PropTypes.func
}
