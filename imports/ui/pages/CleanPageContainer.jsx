// QLICKER
// Author: Enoch T <me@enocht.am>
//
// page_container.jsx: generic wrapper for logged in pages

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

import { PromoteAccountModal } from '../modals/PromoteAccountModal'
import { Courses } from '../../api/courses'

import { userGuideUrl } from '../../configs.js'
import $ from 'jquery'

class _CleanPageContainer extends Component {

  constructor (props) {
    super(props)
    this.state = {
      promotingAccount: false,
      courseId: this.props && this.props.courseId ? this.props.courseId : '',
      courseCode: '',
      ssoLogoutUrl: null,
      ssoInstitution: null,
      showCourse: (this.props && this.props.courseId)
    }
    alertify.logPosition('bottom right')

    this.changeCourse = this.changeCourse.bind(this)
    this.setCourseCode = this.setCourseCode.bind(this)

    if(this.state.courseId !== '') {
      this.setCourseCode(this.state.courseId)
    }

  }

  setCourseCode (courseId) {
    Meteor.call('courses.getCourseCodePretty', courseId, (e, c) => {
      if(c) {
        this.setState({ courseCode: c})
      }
    })
  }

  componentWillMount () {
    const token =  Meteor.user() ? Meteor._localStorage.getItem('Meteor.loginToken') : undefined
    if (token){
      Meteor.call("getSSOLogoutUrl", token, (err,result) => {
        if(!err){
          this.setState({ssoLogoutUrl:result})
          Meteor.call("settings.getSSOInstitution", (err2,name) => {
            if(!err2)this.setState({ssoInstitution:name})
          })
        }
      })
    }
  }

/*
  componentDidMount () {
    // Close the dropdown when selecting a link during mobile
    // view.
    $('nav ul li:not(.dropdown), nav ul li ul li').click(function () {
      $('#ql-page-horiz-menu').prop("checked", false)
    })
  }*/

  componentWillReceiveProps (nextProps) {
    this.setState({ courseId: nextProps.courseId ? nextProps.courseId : this.state.courseId, showCourse: nextProps.courseId ? true : false })
    if(nextProps.courseId) this.setCourseCode(nextProps.courseId)
  }

  changeCourse (courseId) {
    const pageName = Router.current().route.getName()
    //TODO: double check this, that all cases are caught!
    if (!(pageName.includes('session') || pageName === 'courses' ||
             pageName === 'professor'  || pageName === 'admin' || pageName === 'student'  ||
             pageName === 'profile' )){
      Router.go(pageName, { courseId: courseId })
      $('#ql-page-horiz-menu').prop("checked", false)
    } else{
      Router.go('course', { courseId: courseId })
      $('#ql-page-horiz-menu').prop("checked", false)
    }
  }

  render () {
    const user = Meteor.user()

    if(!user)  Router.go('logout')

    const canPromote = user.canPromote()
    const isAdmin = user.hasRole('admin')

    const logout = () => {
      Router.go('logout')
      closeMobileMenu()
    }

    const togglePromotingAccount = () => { this.setState({ promotingAccount: !this.state.promotingAccount }); closeMobileMenu() }

    const homePath = () => { Router.go(user.profile.roles[0]) }
    const coursesPage = user.hasGreaterRole('professor')
      ? Router.routes['courses'].path()
      : Router.routes['student'].path()
    const goCoursesPage = () => {Router.go(  user.hasGreaterRole('professor') ? 'courses' : 'student'  )}
    const click = () =>{console.log("click")}

    //------------------
    const closeMobileMenu = () => {$('#ql-page-horiz-menu').prop("checked", false)}

    const goAdmin = () => {
      Router.go('admin')
      closeMobileMenu()
    }

    const goCourseHome = () => {
      Router.go('course', { courseId: this.state.courseId })
      closeMobileMenu()
    }

    const goCourseGrades = () => {
      Router.go('course.results', { courseId: this.state.courseId })
      closeMobileMenu()
    }

    const goAllCourseGrades = () => {
      Router.go('results.overview')
      closeMobileMenu()
    }

    const goCourseQuestions = () => {
      Router.go('questions', { courseId: this.state.courseId })
      closeMobileMenu()
    }

    const goAllCoursesPage = () => {
      Router.go(  user.hasGreaterRole('professor') ? 'courses' : 'student'  )
      this.setState({ courseId: '', showCourse: false })
      closeMobileMenu()
    }

    const goProfile = () => {
      Router.go('profile');
      this.setState({ courseId: '', showCourse: false });
      closeMobileMenu()
    }

    return (
      <div className='ql-page-body'>
        <div className='ql-page-nav'>
          <nav>
            <div className='ql-logo' onClick={homePath} >Qlicker</div>
            <input type="checkbox" id="ql-page-horiz-menu" /><label htmlFor="ql-page-horiz-menu"></label>
            <ul>
              { isAdmin
                 ? <li onClick={goAdmin}><a>Settings</a></li>
                 : ''
              }
              {  this.state.showCourse
                 ? <li onClick={goCourseHome}><a>Course Home</a></li>
                 : ''
              }
              { this.state.showCourse
                ? <li onClick={goCourseGrades}><a>Grades</a></li>
                : isAdmin
                  ? <li onClick={goAllCourseGrades}><a>Grades</a></li>
                  :''
              }
              { this.state.showCourse /*&& !isAdmin*/
                ? <li onClick={goCourseQuestions}> <a>Question library</a></li>
                : ''
              }
              { isAdmin
                ? (this.state.showCourse && this.state.courseId)
                    ? <li>
                        <a href='#'> {this.state.courseCode} </a>
                         <ul >
                           <li onClick={goAllCoursesPage}><a>All Courses</a></li>
                         </ul>
                       </li>
                    : <li onClick={goAllCoursesPage}><a> Courses</a></li>
                : <li className='dropdown'>
                     <a>
                       { this.state.courseId
                         ?  this.state.courseCode
                         : 'Courses'
                       }
                     </a>
                     <ul>
                       <li onClick={goAllCoursesPage}> <a>All Courses</a> </li>
                       { (this.props.courses && this.props.courses.length > 1)
                         ? <div>
                             <li className='divider' />
                             <li className='infolabel'> My Active Courses</li>
                               { this.props.courses.map((c) => {
                                    return (<li key={c._id} onClick={() => this.changeCourse(c._id)} ><a>{c.fullCourseCode()}</a></li>)
                                  })
                                }
                           </div>
                         : ''
                       }
                     </ul>
                  </li>
              }
              <li className='dropdown right profile-pic '>
                <a>
                  <img src={user.getThumbnailUrl()} className='nav-circle' /> {user.getName()}
                </a>
                <ul >
                  <li onClick={goProfile} ><a>User profile</a></li>
                  {canPromote
                    ? <li><a onClick={togglePromotingAccount}>Promote an account to professor</a></li>
                    : ''
                  }
                  <li><a href={userGuideUrl}>Visit user guide</a></li>
                  <li className='divider' />
                  {this.state.ssoLogoutUrl ?
                        <li><a href={this.state.ssoLogoutUrl} onClick={logout}  > Logout from Qlicker and {this.state.ssoInstitution ? this.state.ssoInstitution : 'SSO' }</a></li>
                        : <li><a href={Router.routes['logout'].path()} onClick={logout} >Logout from Qlicker</a></li>
                  }
                </ul>
              </li>
          </ul>
        </nav>
      </div>

      <div className='ql-page-content'>
        { this.props.children }
        { canPromote && this.state.promotingAccount
          ? <PromoteAccountModal done={togglePromotingAccount} />
          : '' }
      </div>
    </div>
    )}
}

export const CleanPageContainer = withTracker(props => {
  const handle = Meteor.subscribe('courses')
  const courses = Courses.find({ inactive: { $in: [null, false] } }).fetch()

  return {
    courses: courses,
    //courseId: props.courseId,
    loading: !handle.ready()
  }
})( _CleanPageContainer)

CleanPageContainer.propTypes = {
  courseId:PropTypes.string
}
