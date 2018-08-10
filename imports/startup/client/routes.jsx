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

import { PageContainer } from '../../ui/pages/page_container'

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
      mount(AppLayout, { content: <PageContainer user={user}> <ProfilePage /> </PageContainer> })
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
      mount(AppLayout, { content: <PageContainer user={user}> <AdminDashboard /> </PageContainer> })
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
      mount(AppLayout, { content: <PageContainer user={user}> <ProfessorDashboard /> </PageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsLibrary } from '../../ui/pages/professor/questions_library'
Router.route('/course/:courseId/questions/library/:_id?', {
  name: 'questions',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('questions.library')
  },
  action: function () {
    const cId = this.params.courseId
    if (Meteor.userId() /* && isInstructor */) {
      mount(AppLayout, { content: <PageContainer user={Meteor.user()} courseId={cId}> <QuestionsLibrary courseId={cId} selected={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsPublic } from '../../ui/pages/professor/questions_public'
Router.route('/course/:courseId/questions/public', {
  name: 'questions.public',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('questions.public')
  },
  action: function () {
    const cId = this.params.courseId
    let user = Meteor.user()
    if (Meteor.userId() /* && isInstructor */) {
      mount(AppLayout, { content: <PageContainer user={user} courseId={cId}> <QuestionsPublic courseId={cId} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsFromStudent } from '../../ui/pages/professor/questions_fromstudent'
Router.route('/course/:courseId/questions/submissions', {
  name: 'questions.fromStudent',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('questions.fromStudent')
  },
  action: function () {
    let user = Meteor.user()
    const isInstructor = Courses.findOne({instructors: user._id}) || Meteor.user().hasRole('professor')
    if (Meteor.userId() && isInstructor) {
      mount(AppLayout, { content: <PageContainer user={user} courseId={this.params.courseId}> <QuestionsFromStudent courseId={this.params.courseId}/> </PageContainer> })
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
      mount(AppLayout, { content: <PageContainer user={user}> <ManageCourses /> </PageContainer> })
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
      mount(AppLayout, { content: <PageContainer user={user}> <StudentDashboard /> </PageContainer> })
    } else Router.go('login')
  }
})

import { ManageCourse } from '../../ui/pages/professor/manage_course'
import { Course } from '../../ui/pages/student/course'
Router.route('/course/:courseId', {
  name: 'course',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses.single', this.params._id)
  },
  action: function () {
    const cId = this.params.courseId
    if (!Meteor.userId()) Router.go('login')
    if (Meteor.user().isInstructor(cId) || Meteor.user().hasRole('admin')) {
      mount(AppLayout, {content: <PageContainer courseId={cId}> <ManageCourse isInstructor courseId={cId} /> </PageContainer>})
    } else if (Meteor.user().isStudent(this.params.courseId)) {
      mount(AppLayout, { content: <PageContainer courseId={cId}> <Course courseId={cId} /> </PageContainer> })
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
      mount(AppLayout, {content: <PageContainer> <ManageCourseGroups courseId={this.params.courseId} /> </PageContainer>})
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
      mount(AppLayout, { content: <PageContainer> <ResultsOverview /> </PageContainer> })
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
      mount(AppLayout, { content: <PageContainer courseId={this.params.courseId}> <CourseGrades courseId={this.params.courseId} /> </PageContainer> })
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
    const cId = sess ? sess.courseId : 0
    if (Meteor.user().isInstructor(cId) || Meteor.user().hasRole('admin')) {
      mount(AppLayout, {content: <PageContainer courseId={this.params.courseId}> <GradeSession sessionId={this.params.sessionId} courseId={cId} /> </PageContainer>})
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
    const sess = Sessions.findOne({_id: this.params.sessionId})
    const cId = sess ? sess.courseId : 0
    let user = Meteor.user()
    if (user) {
      if (user.hasRole('admin') || user.isInstructor(cId)) {
        mount(AppLayout, { content: <PageContainer courseId={cId}> <ResultsPage sessionId={this.params.sessionId} /> </PageContainer> })
      } else if (user.isStudent(cId)) {
        mount(AppLayout, { content: <PageContainer courseId={cId}>
          <StudentSessionResultsPage sessionId={this.params.sessionId} studentId={Meteor.userId()} /> </PageContainer> })
      } else Router.go('login')
    } else Router.go('login')
  }
})

import { ManageSession } from '../../ui/pages/professor/manage_session'
Router.route('/course/:courseId/session/edit/:_id', {
  name: 'session.edit',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') &&
      Meteor.subscribe('sessions.single', this.params._id) &&
      Meteor.subscribe('courses') &&
      Meteor.subscribe('images') &&
      Meteor.subscribe('questions.inSession', this.params._id)
  },
  action: function () {
    const cId = Courses.find({sessions: this.params._id}).fetch()[0]._id
    const isInstructor = Meteor.user().isInstructor(cId)
    if (Meteor.userId() && isInstructor) {
      mount(AppLayout, { content: <PageContainer courseId={cId}> <ManageSession isInstructor={isInstructor} sessionId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { RunSession } from '../../ui/pages/professor/run_session'
Router.route('/course/:courseId/session/run/:_id', {
  name: 'session.run',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions.single', this.params._id) && Meteor.subscribe('courses') && Meteor.subscribe('questions.inSession', this.params._id)
  },
  action: function () {
    const sess = Sessions.findOne(this.params._id)
    const cId = sess ? sess.courseId : ''
    if (Meteor.userId() && Meteor.user().isInstructor(cId)) {
      mount(AppLayout, { content: <PageContainer courseId={cId}> <RunSession sessionId={this.params._id} courseId={cId} /> </PageContainer> })
    } else Router.go('login')
  }
})

Router.route('/course/:courseId/session/run/:_id/mobile', {
  name: 'session.run.mobile',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions.single', this.params._id) && Meteor.subscribe('courses') && Meteor.subscribe('questions.inSession', this.params._id)
  },
  action: function () {
    const sess = Sessions.findOne(this.params._id)
    const cId = sess ? sess.courseId : ''
    if (Meteor.userId() && Meteor.user().isInstructor(cId)) {
      mount(AppLayout, { content: <RunSession mobile sessionId={this.params._id} courseId={cId} /> })
    } else Router.go('login')
  }
})

import { Session } from '../../ui/pages/student/session'
Router.route('/course/:courseId/session/present/:_id', {
  name: 'session',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions.single', this.params._id) && Meteor.subscribe('courses')
  },
  action: function () {
    const user = Meteor.user()
    const cId = Courses.find({sessions: this.params._id}).fetch()[0]._id
    if (user && user.isInstructor(cId)) { // If it's an instructor, then this is called when using "2nd display" while running session
      mount(AppLayout, { content: <Session sessionId={this.params._id} /> })
    } else if (user) {
      mount(AppLayout, { content: <PageContainer courseId={cId}> <Session sessionId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})
