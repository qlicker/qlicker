
//import {FlowRouter} from 'meteor/kadira:flow-router'
//
import React from 'react'
import { mount } from 'react-mounter'

//Layouts and Pages
import { AppLayout } from '../../ui/layouts/app_layout'
import { Homepage } from '../../ui/pages/home'
import { Loginpage } from '../../ui/pages/login'
import { AdminDashboard } from '../../ui/pages/admin_dashboard'
import { StudentDashboard } from '../../ui/pages/student_dashboard'
import { ProfessorDashboard } from '../../ui/pages/professor_dashboard'


// For routes that are waiting on data, 
// this.render('blank') is needed cause ironrouter expects you to render a blaze template
// we need to remove default ironrouter Loading... message cause we aren't using templates

Router.route("/", function() {
  mount(AppLayout, {
    content: <Homepage/>
  })
}, {
  name: "home",
})

Router.route("/login", function() {
  mount(AppLayout, {
    content: <Loginpage/>
  })
}, {
  name: "login",
})


// Admin routes
Router.route("/admin", {
  name: "admin",
  waitOn: function(){
    return Meteor.subscribe("userData");
  },
  action: function () {
    this.render('blank')    

    let user = Meteor.user()
    if (Meteor.userHasRole(user, 'admin')) {
      mount(AppLayout, {
        content: <AdminDashboard/>
      }) 
    } else Router.go('login')
    
  }
})

// Prof routes
Router.route("/manage", {
  name: "professor",
  waitOn: function(){
    return Meteor.subscribe("userData");
  },
  action: function () {
    this.render('blank')     
  
    let user = Meteor.user()
    if (Meteor.userHasRole(user, 'professor')) {
      mount(AppLayout, {
        content: <ProfessorDashboard/>
      }) 
    } else Router.go('login')

  }
})

// Student Routes
Router.route("/student", {
  name: "student",
  waitOn: function(){
    return Meteor.subscribe("userData");
  },
  action: function () {
    this.render('blank')     
  
    let user = Meteor.user()
    if (Meteor.userHasRole(user, 'student')) {
      mount(AppLayout, {
        content: <StudentDashboard/>
      }) 
    } else Router.go('login')

  }
})
