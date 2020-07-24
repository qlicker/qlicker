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
      showCourse: (this.props && this.props.courseId),
      showVideo: false
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
    if (this.props && this.props.courseId){
      Meteor.call('settings.courseHasJitsiEnabled', this.props.courseId, (err,result) => {
        if(!err){
          this.setState({showVideo:result})
        }
      })
    }

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


  componentDidMount () {
    // Close the dropdown when selecting a link during mobile
    // view.
    //$('#course-dropdown').hide()
  //  $('#profile-dropdown').hide()
    $('#ql-page-horiz-menu').prop("checked", false)

  }

  componentWillReceiveProps (nextProps) {
    if(nextProps.courseId && nextProps.courseId != this.state.courseId){
      Meteor.call('settings.courseHasJitsiEnabled', nextProps.courseId, (err,result) => {
        if(!err){
          this.setState({showVideo:result})
        }
      })
    }

    this.setState({ courseId: nextProps.courseId ? nextProps.courseId : this.state.courseId, showCourse: nextProps.courseId ? true : false } )

    if(nextProps.courseId){
      this.setCourseCode(nextProps.courseId)
    }
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
    const togglePromotingAccount = () => { this.setState({ promotingAccount: !this.state.promotingAccount }); closeMobileMenu() }

    const closeSubMenus = () => {
      $('#course-dropdown').hide()
      $('#profile-dropdown').hide()
    }

/* // click any where to close a sub menu, but then messes up the toggle aspect of the dropdown li
    $(document).click(function() {
      closeSubMenus()
    });
*/
    const closeMobileMenu = () => {
      $('#ql-page-horiz-menu').prop("checked", false)
    }
    // All of the links to follow (except links to specific courses)
    const logout = () => {
      Router.go('logout')
      closeMobileMenu()
    }

    const logoutSSO = () => {
      if (this.state.ssoLogoutUrl){
        window.location.href=this.state.ssoLogoutUrl
      }
      Router.go('logout')
      closeMobileMenu()
    }

    const goUserGuide = () => {
      window.location.href=userGuideUrl
      closeMobileMenu()
    }

    const goAdmin = () => {
      Router.go('admin')
      closeMobileMenu()
    }

    const goCourseHome = () => {
      Router.go('course', { courseId: this.state.courseId })
      closeMobileMenu()
      closeSubMenus()
    }

    const goCourseGrades = () => {
      Router.go('course.results', { courseId: this.state.courseId })
      closeMobileMenu()
      closeSubMenus()
    }

    const goAllCourseGrades = () => {
      Router.go('results.overview')
      closeMobileMenu()
      closeSubMenus()
    }

    const goCourseQuestions = () => {
      Router.go('questions', { courseId: this.state.courseId })
      closeMobileMenu()
      closeSubMenus()
    }

    const goVideoChat = () => {
      Router.go('videochat', { courseId: this.state.courseId })
      closeMobileMenu()
      closeSubMenus()
    }

    const goAllCoursesPage = () => {
      Router.go(  user.hasGreaterRole('professor') ? 'courses' : 'student'  )
      this.setState({ courseId: '', showCourse: false })
      closeMobileMenu()
      //don't close submenu because the top level button already toggles it...
    }

    const goAllCoursesPageAndClose = () => {
      Router.go(  user.hasGreaterRole('professor') ? 'courses' : 'student'  )
      this.setState({ courseId: '', showCourse: false })
      closeMobileMenu()
      closeSubMenus()// when qlicking the Qlicker logo...
    }

    const goProfile = () => {
      Router.go('profile');
      this.setState({ courseId: '', showCourse: false });
      closeMobileMenu()
      //don't close submenu because the top level button already toggles it...
    }

    return (
      <div className='ql-page-body'>
        <div className='ql-page-nav'>
          <nav>
            <div className='ql-logo' onClick={goAllCoursesPageAndClose} >Qlicker</div>
            <input type="checkbox" id="ql-page-horiz-menu" /><label onClick={closeSubMenus} htmlFor="ql-page-horiz-menu"></label>
            <ul>
              { isAdmin
                 ? <li onClick={goAdmin}><a href='#'>Settings</a></li>
                 : ''
              }
              {  this.state.showCourse
                 ? <li onClick={goCourseHome}><a href='#'>Course Home</a></li>
                 : ''
              }
              { this.state.showCourse
                ? <li onClick={goCourseGrades}><a href='#'>Grades</a></li>
                : isAdmin
                  ? <li onClick={goAllCourseGrades}><a href='#'>Grades</a></li>
                  :''
              }
              { this.state.showCourse /*&& !isAdmin*/
                ? <li onClick={goCourseQuestions}> <a href='#'>Question library</a></li>
                : ''
              }
              { this.state.showCourse && this.state.showVideo /*&& !isAdmin*/
                ? <li onClick={goVideoChat}> <a href='#'>Video chat</a></li>
                : ''
              }
              { isAdmin
                ? (this.state.showCourse && this.state.courseId)
                    ? <li>
                        <a href='#'> {this.state.courseCode} </a>
                         <ul >
                           <li onClick={goAllCoursesPage}><a href='#'>All Courses</a></li>
                         </ul>
                       </li>
                    : <li onClick={goAllCoursesPage}><a href='#'> Courses</a></li>
                : <li className='ql-dropdown' onClick = { () => {$('#course-dropdown').toggle(); $('#profile-dropdown').hide()}}>
                     <a href='#'>
                       { this.state.courseId
                         ?  this.state.courseCode
                         : 'Courses'
                       }
                     </a>
                     <ul id='course-dropdown'>
                       <li onClick={goAllCoursesPage}> <a>All Courses</a> </li>
                       { (this.props.courses && this.props.courses.length > 1)
                         ? <div>
                             <li className='divider' />
                             <li className='infolabel'> My Active Courses</li>
                               { this.props.courses.map((c) => {
                                    return (<li key={c._id} onClick={() => this.changeCourse(c._id)} ><a href='#'>{c.fullCourseCode()}</a></li>)
                                  })
                                }
                           </div>
                         : ''
                       }
                     </ul>
                  </li>
              }
              <li className='ql-dropdown right profile-pic' onClick = { () => {$('#profile-dropdown').toggle(); $('#course-dropdown').hide()}}>
                <a href='#'>
                  <div className='img-circle-crop'>
                    <img src={user.getThumbnailUrl()}  />
                  </div>
                  &nbsp; {user.getName()}
                </a>
                <ul id='profile-dropdown' >
                  <li onClick={goProfile} ><a href='#'>User profile</a></li>
                  {canPromote
                    ? <li onClick={togglePromotingAccount}><a href='#'>Promote an account to professor</a></li>
                    : ''
                  }
                  <li onClick={goUserGuide}><a href='#'>Visit user guide</a></li>
                  <li className='divider' onClick={logout} />
                  {this.state.ssoLogoutUrl ?
                        <li onClick={logoutSSO} ><a href='#'> Logout from Qlicker and {this.state.ssoInstitution ? this.state.ssoInstitution : 'SSO' }</a></li>
                        : <li onClick={logout}><a href='#'> Logout from Qlicker</a></li>
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
