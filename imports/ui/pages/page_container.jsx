// QLICKER
// Author: Enoch T <me@enocht.am>
//
// page_container.jsx: generic wrapper for logged in pages

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'

class _PageContainer extends Component {

  constructor (props) {
    super(props)
    this.state = {}
    this.state.user = Meteor.user() || this.props.user

    alertify.logPosition('bottom right')
  }

  render () {
    const logout = () => {
      Router.go('login')
      Meteor.logout()
    }

    const homePath = Router.routes[this.state.user.profile.roles[0]].path()
    const coursesPage = this.state.user.hasRole('professor')
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
                <li className='dropdown'>
                  <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>Courses <span className='caret' /></a>
                  <ul className='dropdown-menu' >
                    <li><a href={coursesPage}>All Courses</a></li>
                    <li role='separator' className='divider' >&nbsp;</li>
                    <li className='dropdown-header'>My Active Courses</li>
                    {
                      this.props.courses.map((c) => {
                        return (<li key={c._id}><a className='uppercase' href='#' onClick={() => Router.go('course', { _id: c._id })}>{c.fullCourseCode()}</a></li>)
                      })
                    }
                  </ul>
                </li>
                {
                  this.state.user.hasRole('professor')
                    ? <li className='dropdown'>
                      <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>Questions <span className='caret' /></a>
                      <ul className='dropdown-menu' >
                        <li><a href={Router.routes['questions'].path()}>My Question Library</a></li>
                        <li role='separator' className='divider' >&nbsp;</li>
                        <li><a href={Router.routes['questions.public'].path()}>Public Questions</a></li>
                        <li><a href={Router.routes['questions.fromStudent'].path()}>Student Submissions</a></li>
                      </ul>
                    </li>
                    : ''
                }
                <li><a className='bootstrap-overrides' href='#'>Grades</a></li>
              </ul>

              <ul className='nav navbar-nav navbar-right'>
                <li className='dropdown bootstrap-overrides-padding'>
                  <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
                    <img src={this.state.user.getImageUrl()} className='nav-profile img-circle' /> {this.state.user.getName()} <span className='caret' />
                  </a>
                  <ul className='dropdown-menu'>
                    <li><a href={Router.routes['profile'].path()}>Profile</a></li>
                    <li><a href='#'>Settings</a></li>
                    <li role='separator' className='divider' />
                    <li><a href='#' onClick={logout} >Logout</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className='ql-child-container'>{ this.props.children }</div>
      </div>)
  }

}

export const PageContainer = createContainer(() => {
  const handle = Meteor.subscribe('courses')

  return {
    courses: Courses.find({}).fetch(),
    loading: !handle.ready()
  }
}, _PageContainer)
