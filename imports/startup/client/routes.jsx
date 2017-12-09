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
      let user = Meteor.user()
      if (user.hasRole('admin')) Router.go('admin')
      if (user.hasRole('professor')) Router.go('professor')
      if (user.hasRole('student')) Router.go('student')
    } else mount(AppLayout, { content: <Loginpage /> })
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
Router.route('/questions/library/:_id?', {
  name: 'questions',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('questions.library')
  },
  action: function () {
    if (Meteor.userId() /* && isInstructor */) {
      mount(AppLayout, { content: <PageContainer user={Meteor.user()}> <QuestionsLibrary selected={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsPublic } from '../../ui/pages/professor/questions_public'
Router.route('/questions/public', {
  name: 'questions.public',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('questions.public')
  },
  action: function () {
    let user = Meteor.user()
    if (Meteor.userId() /* && isInstructor */) {
      mount(AppLayout, { content: <PageContainer user={user}> <QuestionsPublic /> </PageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsFromStudent } from '../../ui/pages/professor/questions_fromstudent'
Router.route('/questions/submissions', {
  name: 'questions.fromStudent',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('questions.fromStudent')
  },
  action: function () {
    let user = Meteor.user()
    const isInstructor = Courses.findOne({instructors: user._id}) || Meteor.user().hasRole('professor')
    if (Meteor.userId() && isInstructor) {
      mount(AppLayout, { content: <PageContainer user={user}> <QuestionsFromStudent /> </PageContainer> })
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

// Shared routes
import { ManageCourse } from '../../ui/pages/professor/manage_course'
import { Course } from '../../ui/pages/student/course'
Router.route('/course/:_id', {
  name: 'course',
  waitOn: function () {
    // could the myTAs be wrong for a TA???
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') /* && Meteor.subscribe('users.myTAs') */
  },
  action: function () {
    if (Meteor.userId() && Meteor.user().hasGreaterRole('professor')) {
      mount(AppLayout, {content: <PageContainer> <ManageCourse courseId={this.params._id} /> </PageContainer>})
    } else if (Meteor.user().isInstructor(this.params._id)) {
      mount(AppLayout, {content: <PageContainer> <ManageCourse isInstructor courseId={this.params._id} /> </PageContainer>})
    } else if (Meteor.user().hasRole('student')) {
      mount(AppLayout, { content: <PageContainer> <Course courseId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { ResultsOverview } from '../../ui/pages/results_overview'
Router.route('/courses/results', {
  name: 'results.overview',
  waitOn: function () {
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
Router.route('/course/:_id/results', {
  name: 'course.results',
  waitOn: function () {
    return Meteor.subscribe('userData')
  },
  action: function () {
    const u = Meteor.user()
    const isInstructor = u.isInstructor(this.params._id)
    if (u && isInstructor) {
      mount(AppLayout, { content: <PageContainer> <CourseGrades courseId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { ResultsPage } from '../../ui/pages/results'
Router.route('/results/session/:sessionId', {
  name: 'session.results',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('sessions')
  },
  action: function () {
    const sess = Sessions.findOne({_id: this.params.sessionId})
    const cId = sess ? sess.courseId : 0
    let user = Meteor.user()
    if (user && user.isInstructor(cId)) {
      mount(AppLayout, { content: <PageContainer> <ResultsPage sessionId={this.params.sessionId} /> </PageContainer> })
    } else Router.go('login')
  }
})
/*
//This route does not currently work, assume that StudentResultsPage is not working.
//Should be able to handle this route from course/:id/results instead and reuse
//the same component but with different subscrption.

import { StudentResultsPage } from '../../ui/pages/student_results'
Router.route('/results/:studentId/:courseId', {
  name: 'student.results',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('sessions')
  },
  action: function () {
    if (Meteor.user()) {
      mount(AppLayout, { content: <PageContainer>
        <StudentResultsPage studentId={this.params.studentId} courseId={this.params.courseId} />
      </PageContainer> })
    } else Router.go('login')
  }
}) */

import { StudentSessionResultsPage } from '../../ui/pages/student_session_results'
Router.route('/results/:sessionId', {
  name: 'student.session.results',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('sessions')
  },
  action: function () {
    const user = Meteor.user()
    const sess = Sessions.findOne({_id: this.params.sessionId})
    const cId = sess ? sess.courseId : 0
    const course = Courses.find({cId: {$in: user.profile.courses}})
    if (user && cId && course) {
      mount(AppLayout, { content: <PageContainer>
        <StudentSessionResultsPage sessionId={this.params.sessionId} studentId={Meteor.userId()} />
      </PageContainer> })
    } else Router.go('login')
  }
})

import { ManageSession } from '../../ui/pages/professor/manage_session'
Router.route('/session/edit/:_id', {
  name: 'session.edit',
  waitOn: function () {
    return Meteor.subscribe('userData') &&
      Meteor.subscribe('sessions') &&
      Meteor.subscribe('courses') &&
      Meteor.subscribe('images') &&
      Meteor.subscribe('questions.inSession', this.params._id)
  },
  action: function () {
    const cId = Courses.find({sessions: this.params._id}).fetch()[0]._id
    const isInstructor = Meteor.user().isInstructor(cId)
    if (Meteor.userId() && isInstructor) {
      mount(AppLayout, { content: <PageContainer> <ManageSession isInstructor={isInstructor} sessionId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { RunSession } from '../../ui/pages/professor/run_session'
Router.route('/session/run/:_id', {
  name: 'session.run',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions') && Meteor.subscribe('courses') && Meteor.subscribe('questions.inSession', this.params._id)
  },
  action: function () {
    const sess = Sessions.findOne(this.params._id)
    const cId = sess ? sess.courseId : ''
    if (Meteor.userId() && Meteor.user().isInstructor(cId)) {
      mount(AppLayout, { content: <PageContainer> <RunSession sessionId={this.params._id} courseId={cId} /> </PageContainer> })
    } else Router.go('login')
  }
})

Router.route('/session/run/:_id/mobile', {
  name: 'session.run.mobile',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions') && Meteor.subscribe('courses') && Meteor.subscribe('questions.inSession', this.params._id)
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
Router.route('/session/present/:_id', {
  name: 'session',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions') && Meteor.subscribe('courses')
  },
  action: function () {
    const user = Meteor.user()
    const cId = Courses.find({sessions: this.params._id}).fetch()[0]._id
    if (user && user.isInstructor(cId)) {
      mount(AppLayout, { content: <Session sessionId={this.params._id} /> })
    } else if (user) {
      mount(AppLayout, { content: <PageContainer> <Session sessionId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})
