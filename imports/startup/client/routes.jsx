// QLICKER
// Author: Enoch T <me@enocht.am>
//
// routes.jsx: iron-router routes

import React from 'react'
import { mount } from 'react-mounter'

// Layouts and Pages
import { AppLayout } from '../../ui/layouts/app_layout'
import { Homepage } from '../../ui/pages/home'
import { Loginpage } from '../../ui/pages/login'

import { Courses } from '../../api/courses.js'

import { Sessions } from '../../api/sessions.js'

import { ResetPasswordPage } from '../../ui/pages/reset_password'

import { CleanPageContainer} from '../../ui/pages/CleanPageContainer'

Router.configure({
  loadingTemplate: 'loading'
})
Router.onBeforeAction(function () {
  this.render('blank') // workaround for mounting react without blaze template
//  if (!Meteor.userId()) Router.go('login')
  this.next()
})

Router.route('/', function () {
  mount(AppLayout, { content: <Homepage /> })
}, {
  name: 'home'
})

Router.route('/login', {
  name: 'login',
  waitOn: function () {
    return Meteor.subscribe('userData')
  },
  action: function () {
    if (Meteor.userId()) {
      // TODO: These should all go to the same page, for example, a user could be a professor
      // for some courses and a student for others, as well as an admin...
      let user = Meteor.user()
      if (user.hasRole('admin')) Router.go('admin')
      if (user.hasRole('professor')) Router.go('professor')
      if (user.hasRole('student')) Router.go('student')
    } else mount(AppLayout, { content: <Loginpage /> })
  }
})

Router.route('/login/email', {
  name: 'login.email',
  waitOn: function () {
    return Meteor.subscribe('userData')
  },
  action: function () {
    if (Meteor.userId()) {
      // TODO: These should all go to the same page, for example, a user could be a professor
      // for some courses and a student for others, as well as an admin...
      let user = Meteor.user()
      if (user.hasRole('admin')) Router.go('admin')
      if (user.hasRole('professor')) Router.go('professor')
      if (user.hasRole('student')) Router.go('student')
    } else mount(AppLayout, { content: <Loginpage allowEmailLogin={true} /> })
  }
})

Router.route('/logout', {
  name: 'logout',
  action: function () {
    if (Meteor.userId()) {
      Meteor.logout( () => Router.go('login'))
    } else { Router.go('login') }
  }
})

Router.route('/reset/:token', function () {
  mount(AppLayout, { content: <ResetPasswordPage token={this.params.token} /> })
}, {
  name: 'reset-password'
})

import { ProfilePage } from '../../ui/pages/profile'
Router.route('/profile', {
  name: 'profile',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('images')
  },
  action: function () {
    let user = Meteor.user()
    if (user) {
      mount(AppLayout, { content: <CleanPageContainer > <ProfilePage /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

Router.route('/verify-email/:token', {
  name: 'verify-email',
  action: function () {
    if (this.params.token) {
      Accounts.verifyEmail(this.params.token, (error) => {
        if (error) {
          alertify.error('Error: ' + error.reason)
        } else {
          Router.go('/login')
          alertify.success('Email verified! Thanks!')
        }
      })
    } else {
      alertify.error('Error: could not verify your email.')
      Router.go('/')
    }
  }
})

// Admin routes
import { AdminDashboard } from '../../ui/pages/admin/admin_dashboard'
Router.route('/admin', {
  name: 'admin',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('users.all') && Meteor.subscribe('settings') && Meteor.subscribe('courses')
  },
  action: function () {
    let user = Meteor.user()
    if (Meteor.userId() && user.hasRole('admin')) {
      mount(AppLayout, { content: <CleanPageContainer > <AdminDashboard /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

// Prof routes
import { ProfessorDashboard } from '../../ui/pages/professor/professor_dashboard'
Router.route('/manage', {
  name: 'professor',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData')
  },
  action: function () {
    let user = Meteor.user()
    if (Meteor.userId() && user.hasRole('professor')) {
      mount(AppLayout, { content: <CleanPageContainer > <ProfessorDashboard /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsLibrary } from '../../ui/pages/questions_library'
Router.route('/course/:courseId/questions', {
  name: 'questions',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses')
  },
  action: function () {
    const cId = this.params.courseId
    if (Meteor.userId() /* && isInstructor */) {
      mount(AppLayout, { content: <CleanPageContainer courseId={cId}> <QuestionsLibrary courseId={cId} /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { ManageCourses } from '../../ui/pages/professor/manage_courses'
Router.route('/courses', {
  name: 'courses',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData')
  },
  action: function () {
    let user = Meteor.user()
    if (Meteor.userId() && user.hasGreaterRole('professor')) {
      mount(AppLayout, { content: <CleanPageContainer> <ManageCourses /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

// Student Routes
import { StudentDashboard } from '../../ui/pages/student/student_dashboard'
Router.route('/student', {
  name: 'student',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData')
  },
  action: function () {
    let user = Meteor.user()
    if (Meteor.userId() && user.hasGreaterRole('student')) {
      mount(AppLayout, { content: <CleanPageContainer> <StudentDashboard /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { ManageCourse } from '../../ui/pages/professor/manage_course'
import { Course } from '../../ui/pages/student/course'
Router.route('/course/:courseId', {
  name: 'course',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses.single', this.params.courseId)
  },
  action: function () {
    const cId = this.params.courseId
    if (!Meteor.userId()) Router.go('login')
    if (Meteor.user().isInstructor(cId) || Meteor.user().hasRole('admin')) {
      mount(AppLayout, {content: <CleanPageContainer courseId={cId}> <ManageCourse isInstructor courseId={cId} /> </CleanPageContainer>})
    } else if (Meteor.user().isStudent(this.params.courseId)) {
      mount(AppLayout, { content: <CleanPageContainer courseId={cId}> <Course courseId={cId} /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { ManageCourseGroups } from '../../ui/pages/professor/manage_course_groups'
Router.route('/course/:courseId/groups', {
  name: 'course.groups',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses.single', this.params.courseId)
  },
  action: function () {
    if (!Meteor.userId()) Router.go('login')
    if (Meteor.user().isInstructor(this.params.courseId) || Meteor.user().hasRole('admin')) {
      mount(AppLayout, {content: <CleanPageContainer courseId={this.params.courseId}> <ManageCourseGroups courseId={this.params.courseId} /> </CleanPageContainer>})
    } else Router.go('login')
  }
})

import { ResultsOverview } from '../../ui/pages/results_overview'
Router.route('/courses/results', {
  name: 'results.overview',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData')
  },
  action: function () {
    const u = Meteor.user()
    const isInstructorAnyCourse = u.isInstructorAnyCourse()
    if (u && isInstructorAnyCourse) {
      mount(AppLayout, { content: <CleanPageContainer> <ResultsOverview /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { CourseGrades } from '../../ui/pages/course_grades'
Router.route('/course/:courseId/grades', {
  name: 'course.results',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses.single', this.params.courseId)
  },
  action: function () {
    const u = Meteor.user()
    const isInCourse = u.isInstructor(this.params.courseId) || u.isStudent(this.params.courseId)
    if (u && isInCourse) {
      mount(AppLayout, { content: <CleanPageContainer courseId={this.params.courseId}> <CourseGrades courseId={this.params.courseId} /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { GradeSession } from '../../ui/pages/professor/grade_session'
Router.route('/course/:courseId/session/:sessionId/grade', {
  name: 'session.grade',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions.single', this.params.sessionId) && Meteor.subscribe('courses')
  },
  action: function () {
    if (!Meteor.userId()) Router.go('login')
    const sess = Sessions.findOne({_id: this.params.sessionId})
    const cId = this.params.courseId
    if (Meteor.user().isInstructor(cId) || Meteor.user().hasRole('admin')) {
      mount(AppLayout, {content: <CleanPageContainer courseId={this.params.courseId}> <GradeSession sessionId={this.params.sessionId} courseId={this.params.courseId} /> </CleanPageContainer>})
    } else Router.go('login')
  }
})

import { ResultsPage } from '../../ui/pages/results'
import { StudentSessionResultsPage } from '../../ui/pages/student_session_results'

Router.route('/course/:courseId/session/:sessionId/results', {
  name: 'session.results',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions.single', this.params.sessionId) && Meteor.subscribe('courses')
  },
  action: function () {
    const cId = this.params.courseId
    let user = Meteor.user()
    if (user) {
      if (user.hasRole('admin') || user.isInstructor(cId)) {
        mount(AppLayout, { content: <CleanPageContainer courseId={cId}> <ResultsPage sessionId={this.params.sessionId} /> </CleanPageContainer> })
      } else if (user.isStudent(cId)) {
        mount(AppLayout, { content: <CleanPageContainer courseId={cId}>
          <StudentSessionResultsPage sessionId={this.params.sessionId} studentId={Meteor.userId()} /> </CleanPageContainer> })
      } else Router.go('login')
    } else Router.go('login')
  }
})

import { ManageSession } from '../../ui/pages/professor/manage_session'
Router.route('/course/:courseId/session/edit/:sessionId', {
  name: 'session.edit',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') &&
      Meteor.subscribe('sessions.single', this.params.sessionId) &&
      Meteor.subscribe('courses') &&
      Meteor.subscribe('images')
  },
  action: function () {
    const cId = this.params.courseId
    const isInstructor = Meteor.user().isInstructor(cId)
    if (Meteor.userId() && isInstructor) {
      mount(AppLayout, { content: <CleanPageContainer courseId={cId}> <ManageSession isInstructor={isInstructor} sessionId={this.params.sessionId} /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { RunSession } from '../../ui/pages/professor/run_session'
Router.route('/course/:courseId/session/run/:sessionId', {
  name: 'session.run',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') &&
           Meteor.subscribe('sessions.single', this.params.sessionId) &&
           Meteor.subscribe('courses') &&
           Meteor.subscribe('questions.inSession', this.params.sessionId)
  },
  action: function () {
    if (Meteor.userId() && Meteor.user().isInstructor(this.params.courseId)) {
      mount(AppLayout, { content: <CleanPageContainer courseId={this.params.courseId}> <RunSession sessionId={this.params.sessionId} courseId={this.params.courseId} /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

Router.route('/course/:courseId/session/run/:sessionId/mobile', {
  name: 'session.run.mobile',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') &&
           Meteor.subscribe('sessions.single', this.params.sessionId) &&
           Meteor.subscribe('courses') &&
           Meteor.subscribe('questions.inSession', this.params.sessionId)
  },
  action: function () {
    if (Meteor.userId() && Meteor.user().isInstructor(this.params.courseId)) {
      mount(AppLayout, { content: <RunSession mobile sessionId={this.params.sessionId} courseId={this.params.courseId} /> })
    } else Router.go('login')
  }
})

import { Session } from '../../ui/pages/student/session'
import { QuizSession } from '../../ui/QuizSession'
Router.route('/course/:courseId/session/present/:_id', {
  name: 'session',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('sessions.single',this.params._id)
  },
  action: function () {
    const user = Meteor.user()
    const cId = this.params.courseId
    if (user && user.isInstructor(cId)) { // If it's an instructor, then this is called when using "2nd display" while running session
      mount(AppLayout, { content: <Session sessionId={this.params._id} /> })
    } else if (user && user.isStudent(cId)) {
      const sess = Sessions.findOne({_id: this.params._id})
      if(sess.quiz) mount(AppLayout, { content: <CleanPageContainer courseId={cId}> <QuizSession sessionId={this.params._id} /> </CleanPageContainer> })
      else mount(AppLayout, { content: <CleanPageContainer courseId={cId}> <Session sessionId={this.params._id} /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { VideoChat } from '../../ui/VideoChat'
Router.route('/course/:courseId/videochat', {
  name: 'videochat',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses.single', this.params.courseId) && Meteor.subscribe('sessions.single',this.params._id)
  },
  action: function () {
    const user = Meteor.user()
    const cId = this.params.courseId
    if(user && (user.isInstructor(cId) || user.isStudent(cId)) ){
      mount(AppLayout, { content: <CleanPageContainer courseId={cId}> <VideoChat  courseId={cId} /> </CleanPageContainer> })
    } else Router.go('login')
  }
})

import { JitsiWindow } from '../../ui/JitsiWindow'
Router.route('/course/:courseId/videochatwindow', {
  name: 'courseVideoChatWindow',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses.single', this.params.courseId)
  },
  action: function () {
    const user = Meteor.user()
    const cId = this.params.courseId

    if(user && (user.isInstructor(cId) || user.isStudent(cId)) ){
      const course = Courses.findOne({_id: cId})
      const connectionInfo = course ? course.videoConnectionInfo() : null

      mount(AppLayout, { content:
        <JitsiWindow connectionInfo={connectionInfo} />
      })  

    } else Router.go('login')
  }
})


Router.route('/course/:courseId/categoryvideochatwindow/:catNumber/:gNumber', {
  name: 'categoryVideoChatWindow',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses.single', this.params.courseId)
  },
  action: function () {
    const user = Meteor.user()
    const cId = this.params.courseId

    if(user && (user.isInstructor(cId) || user.isStudent(cId)) ){
      const course = Courses.findOne({_id: cId})
      if(!course) Router.go('login')
      const connectionInfo = user.isInstructor(cId)
        ? course.categoryVideoConnectionInfo(this.params.catNumber, this.params.gNumber)
        : course.categoryVideoConnectionInfo(this.params.catNumber)

      mount(AppLayout, { content:
        <JitsiWindow connectionInfo={connectionInfo} />
      })

    } else Router.go('login')
  }
})
