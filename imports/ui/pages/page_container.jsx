// QLICKER
// Author: Enoch T <me@enocht.am>
//
// page_container.jsx: generic wrapper for logged in pages

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import $ from 'jquery'

import { PromoteAccountModal } from '../modals/PromoteAccountModal'
import { Courses } from '../../api/courses'

class _PageContainer extends Component {

  constructor (props) {
    super(props)
    this.state = { promotingAccount: false }
    this.state.user = Meteor.user() || this.props.user

    alertify.logPosition('bottom right')
  }

  componentDidMount () {
    $('.navbar-collapse a.close-nav').click(function () {
      $('.navbar-collapse').collapse('hide')
    })
  }

  render () {
    const isInstructor = Courses.findOne({instructors: Meteor.userId()}) && !this.state.user.hasRole('admin')
    const isProfOrAdmin = this.state.user.hasGreaterRole('professor') || isInstructor


    const logout = () => {
      Meteor.logout(() => Router.go('login'))
    }

    const togglePromotingAccount = () => { this.setState({ promotingAccount: !this.state.promotingAccount }) }

    const homePath = Router.routes[this.state.user.profile.roles[0]].path()
    const coursesPage = this.state.user.hasGreaterRole('professor')
      ? Router.routes['courses'].path()
      : Router.routes['student'].path()
    return (
      <div className='ql-page-container'>
        <nav className='navbar navbar-default navbar-fixed-top'>
          <div className='container'>
            <div className='navbar-header'>
              <button type='button' className='navbar-toggle collapsed' data-toggle='collapse' data-target='#navbar' aria-expanded='false' aria-controls='navbar'>
                <span className='sr-only'>Toggle navigation</span>
                <span className='icon-bar' />
                <span className='icon-bar' />
                <span className='icon-bar' />
              </button>
              <a href={homePath} className='ql-wordmark navbar-brand bootstrap-overrides'>Qlicker</a>
            </div>
            <div id='navbar' className='collapse navbar-collapse'>
              <ul className='nav navbar-nav'>
                {this.state.user.hasRole('admin') ? <li><a className='close-nav' href={Router.routes['admin'].path()}>Dashboard</a></li> : '' }
                {this.state.user.hasRole('admin') ? <li><a className='close-nav' href={Router.routes['courses'].path()}>Courses</a></li>
                : <li className='dropdown'>
                  <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>Courses <span className='caret' /></a>
                  <ul className='dropdown-menu' >
                    <li><a className='close-nav' href={coursesPage}>All Courses</a></li>
                    <li role='separator' className='divider' >&nbsp;</li>
                    <li className='dropdown-header'>My Active Courses</li>
                    {
                      this.props.courses.map((c) => {
                        return (<li key={c._id}><a className='close-nav uppercase' href='#' onClick={() => Router.go('course', { _id: c._id })}>{c.fullCourseCode()}</a></li>)
                      })
                    }
                  </ul>
                </li>
                }
                {

                  isProfOrAdmin
                    ? <li className='dropdown'>
                      <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button'
                         aria-haspopup='true' aria-expanded='false'>Questions <span className='caret'/></a>
                      <ul className='dropdown-menu'>
                        <li><a className='close-nav' href={Router.routes['questions'].path()}>My Question Library</a></li>
                        <li role='separator' className='divider'>&nbsp;</li>
                        <li><a className='close-nav' href={Router.routes['questions.public'].path()}>Public Questions</a>
                        </li>
                        <li><a className='close-nav' href={Router.routes['questions.fromStudent'].path()}>Student
                          Submissions</a></li>
                      </ul>
                    </li> : ''
                }
                {
                  isInstructor ? <li><a className='close-nav bootstrap-overrides' href={Router.routes['results.overview'].path()}>Response Results</a></li>
                  : '' }
              </ul>

              <ul className='nav navbar-nav navbar-right'>
                <li className='dropdown bootstrap-overrides-padding'>
                  <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
                    <img src={this.state.user.getThumbnailUrl()} className='nav-profile img-circle' /> {this.state.user.getName()} <span className='caret' />
                  </a>
                  <ul className='dropdown-menu'>
                    <li><a className='close-nav' href={Router.routes['profile'].path()}>Profile</a></li>
                    {/* <li><a href='#'>Settings</a></li> */}
                    {this.state.user.hasGreaterRole('professor') ? <li><a className='close-nav' href='#' onClick={togglePromotingAccount}>Promote Account</a></li> : ''}
                    <li role='separator' className='divider' />
                    <li><a className='close-nav' href='#' onClick={logout} >Logout</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className='ql-child-container'>
          { this.props.children }
          { this.state.user.hasGreaterRole('professor') && this.state.promotingAccount
            ? <PromoteAccountModal done={togglePromotingAccount} />
            : '' }
        </div>
      </div>)
  }

}

export const PageContainer = createContainer(() => {
  const handle = Meteor.subscribe('courses')
  let courses
  const user = Meteor.user()
/*
  const cArr = user.profile.courses || []
  courses = Courses.find({$or: [ { instructors: Meteor.userId() , inactive: { $in: [null, false] } },
                                 { _id: { $in: cArr }, inactive: { $in: [null, false] } } ] })
*/

  if (user.hasGreaterRole('professor')) {
    //courses = Courses.find({ owner: Meteor.userId(), inactive: { $in: [null, false] } })
    courses = Courses.find({ instructors: Meteor.userId(), inactive: { $in: [null, false] } })
  } else {
    const cArr = user.profile.courses || []
    courses = Courses.find({ _id: { $in: cArr }, inactive: { $in: [null, false] } })
  }

  return {
    courses: courses.fetch(),
    loading: !handle.ready()
  }
}, _PageContainer)
