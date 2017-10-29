// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { Table, Column, Cell } from 'fixed-data-table'
import { GradeTable } from '../GradeTable.jsx'

import { _ } from 'underscore'

import { Courses } from '../../api/courses'
import { Sessions } from '../../api/sessions'
import { Responses } from '../../api/responses'
import { Questions } from '../../api/questions'

import { Stats } from '../../stats'
import { CourseResultsDownloader } from '../CourseResultsDownloader'

class _ClasslistParticipation extends Component {

  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const sessionList = _(this.props.sessionList).pluck('_id')

    const statsMap = _.mapObject(this.props.sessionMap, (val, key) => {
      const q = _.where(this.props.questions, {sessionId: key})
      const r = _.filter(this.props.responses, (resp) => { return val.questions.indexOf(resp.questionId) !== -1 })
      return new Stats(q, r)
    })

    const getTextWidth = (text) => {
      let element = document.createElement('canvas')
      let context = element.getContext('2d')
      const width = (context.measureText(text).width + 30)
      if (width < 110) return 110
      else if (width > 300) return 300
      else return width
    }

    const NameCell = ({rowIndex}) => <Cell>{ this.props.students[rowIndex].getName() }</Cell>
    const PercentageCell = ({rowIndex, sId}) => {
      const session = this.props.sessionMap[sId]
      const student = this.props.students[rowIndex]
      const joined = session.joined || []
      return <Cell>
        { joined.indexOf(student._id) > -1 ? '✓' : '✗' }&nbsp;
        { statsMap[sId].sessionParticipation(student._id) }% / { statsMap[sId].sessionGrade(student._id) }%
      </Cell>
    }

    return (

      <div className='container ql-results-page'>

        <div className='ql-card'>

          <div className='ql-header-bar'>
            <div className='row'>
              <div className='col-xs-offset-2 col-xs-8'><h4><span className='uppercase'>{this.props.course.fullCourseCode()}</span>: Results (participation/grade)</h4>
              </div>
              <div className='col-xs-2'>
                <span className='pull-right'><CourseResultsDownloader course={this.props.course} /></span>
              </div>
            </div>
          </div>

          <div className='ql-card-content'>
            <div>
              <GradeTable courseId={this.props.course._id} />
            </div>
            <Table
              rowHeight={35}
              rowsCount={this.props.students.length}
              width={window.innerWidth - (window.innerWidth * 0.20)}
              height={window.innerHeight - (window.innerHeight * 0.30)}
              headerHeight={50}>
              <Column
                header={<Cell>Last, First</Cell>}
                cell={<NameCell />}
                fixed
                width={170}
              />
              { sessionList.map((sId) =>
                <Column
                  key={sId}
                  header={<Cell onClick={_ => Router.go('session.results', { sessionId: sId })}><a href='#'>{this.props.sessionMap[sId].name}</a></Cell>}
                  cell={<PercentageCell sId={sId} />}
                  width={getTextWidth(this.props.sessionMap[sId].name)}
                />
              ) }

            </Table>
          </div>

        </div>
      </div>

    )
  }

}

// meteor reactive data container
export const ClasslistParticipationPage = createContainer((props) => {
  const handle = Meteor.subscribe('users.myStudents', {cId: props.courseId}) &&
    Meteor.subscribe('courses', {isInstructor: Meteor.user().isInstructor(props.courseId)}) &&
    Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inCourse', props.courseId) &&
    Meteor.subscribe('responses.forCourse', props.courseId) &&
    Meteor.subscribe('grades.forCourse', props.courseId)

  const user = Meteor.user()

  const course = Courses.findOne(props.courseId)

  let questionsInSession, students, sessions, responses
  if (course) {
    students = Meteor.users.find({ _id: { $in: course.students || [] } }, { sort: { 'profile.lastname': 1 } }).fetch()

    const sessionQuery = { courseId: course._id }
    if (user.hasRole('student')) sessionQuery.status = { $ne: 'hidden' }
    sessions = Sessions.find(sessionQuery, { sort: { date: 1 } }).fetch()

    const questionIds = _.flatten(_(sessions).pluck('questions'))

    responses = Responses.find({ questionId: { $in: questionIds } }).fetch()

    questionsInSession = Questions.find({ _id: { $in: questionIds } }).fetch()
  }

  return {
    questions: questionsInSession,
    students: students,
    course: course,
    sessionList: sessions,
    sessionMap: _(sessions).indexBy('_id'),
    responses: responses,
    loading: !handle.ready()
  }
}, _ClasslistParticipation)
