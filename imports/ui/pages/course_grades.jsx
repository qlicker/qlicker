// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

import Select from 'react-select'
import 'react-select/dist/react-select.css'

import { Courses } from '../../api/courses'
import { Sessions } from '../../api/sessions'

import { CleanGradeTable } from '../CleanGradeTable.jsx'

import { ROLES } from '../../configs'


export class _CourseGrades extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selectedSessions:[],
      allSelected: false
    }

    this.setSessions = this.setSessions.bind(this)
    this.selectAllSessions = this.selectAllSessions.bind(this)
    this.clearAllSessions = this.clearAllSessions.bind(this)
  }

  setSessions (sessions) {
    this.setState({ selectedSessions: sessions })
  }

  selectAllSessions() {
    this.setState({allSelected:true, selectedSession:[]})
  }

  clearAllSessions() {
    this.setState({allSelected:false, selectedSession:[]})
  }


  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const allSelected = this.state.allSelected
    const possibleSessions = this.props.possibleSessions
    const selectedSessions = allSelected ? possibleSessions : this.state.selectedSessions
    const sessionIds = _(selectedSessions).pluck('value')
    return (
      <div className='container ql-results-page'>
        <div className='ql-card'>
          <div className='ql-header-bar'>
            <div className='row'>
              <div className='col-xs-offset-2 col-xs-8'><h4><span className='uppercase'>{this.props.courseName}</span>: Grades </h4>
                { allSelected
                  ? <div className='ql-results-page-select-container'>
                      <div className='ql-results-page-select-button'>
                        <div type='button' className='btn btn-secondary' onClick={this.clearAllSessions} >
                          Clear all sessions
                        </div>
                      </div>
                    </div>
                  : <div className='ql-results-page-select-container'>
                      <div className='ql-results-page-select-item'>
                        <Select
                          name='tag-input'
                          placeholder='Session(s) to display'
                          multi
                          value={selectedSessions}
                          options={possibleSessions}
                          onChange={this.setSessions}
                          />
                      </div>
                      <div className='ql-results-page-select-button'>
                        <div type='button' className='btn btn-secondary' onClick={this.selectAllSessions} >
                          Show all sessions
                        </div>
                      </div>
                    </div>
                }
              </div>
            </div>
          </div>
          { selectedSessions && selectedSessions.length > 0
            ? <div className='ql-card-content'>
                <div>
                  <CleanGradeTable courseId={this.props.courseId} studentIds={this.props.studentIds} sessionIds={sessionIds} />
                </div>
              </div>
            : <div className='ql-card-content'>
                <div className='ql-resuls-page-notable'>
                  Select sessions to display!
                </div>
              </div>
          }
        </div>
      </div>
    )
  }

}

export const CourseGrades = withTracker((props) => {
  //const sessionFields = {_id:1, name:1, status:1, reviewable:1, date:1 }
  const handle = Meteor.subscribe('courses.single', props.courseId) &&
                  Meteor.subscribe('sessions.forCourse', props.courseId)

  const course = Courses.findOne(props.courseId)
  let sessions = []
  if (course) {
    const sessionQuery = { courseId: course._id }
    const user = Meteor.user()
    if (!user.hasGreaterRole(ROLES.admin) && !user.isInstructor(props.courseId)) {
      sessionQuery.status = { $ne: 'hidden' }
      sessionQuery.reviewable = true
    }
    sessionQuery._id ={ $in: course.sessions || [] }
    sessions = Sessions.find(sessionQuery, { sort: { date: 1 } }).fetch().reverse()
  }

  let possibleSessions = []
  let nSess = sessions.length

  for (let iSess=0; iSess<nSess; iSess++){
    possibleSessions.push({ value: sessions[iSess]._id, label: sessions[iSess].name.toUpperCase() })
  }


  return {
    courseId: props.courseId,
    courseName: course.name,
    studentIds: course.students,
    sessionIds: course.sessions,
    possibleSessions: possibleSessions,
    loading: !handle.ready()
  }
})( _CourseGrades)

CourseGrades.propTypes = {
  courseId: PropTypes.string
}
