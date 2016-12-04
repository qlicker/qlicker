
//import {FlowRouter} from 'meteor/kadira:flow-router'
//
import React from 'react'
import { mount } from 'react-mounter'

//Layouts and Pages
import { AppLayout } from '../../ui/layouts/app_layout'
import { Homepage } from '../../ui/pages/home'
import { Loginpage } from '../../ui/pages/login'
import { Testpage } from '../../ui/pages/test'

//FlowRouter.route('/', {
//  name: 'home',
//  action() {
//    mount(AppLayout, {
//      content: <Homepage />
//    })
//  }
//})


//FlowRouter.route('/login', {
//  name: 'login',
//  action() {
//    if (Meteor.userId()) {
//      FlowRouter.go('test')
//    }
//    mount(AppLayout, {
//      content: <Loginpage/>
//    })
//  }
//})

//FlowRouter.route('/test', {
//  name: 'test',
// action() {
//    if (!Meteor.userId()) {
//      FlowRouter.go('login')
//   }
//    mount(AppLayout, {
//      content: <Testpage/>
//    })
//  }
//})
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
/*
Router.route("/test", {
  name: "test",
  waitOn: function(){
    return Meteor.subscribe("userData");
  },
  data: function(){
    const user = Meteor.users.find({ _id: Meteor.userId() }).fetch()
    console.log('user', user)

    mount(AppLayout, {
      content: <Testpage/>
    })

  }
})
*/
Router.route("/test", {
  name: "test",
  waitOn: function(){
    return Meteor.subscribe("userData");
  },
  action: function () {
  this.render('blank')

  let user = Meteor.user()

  console.log("in test route", user)

  if (user && user.profile.roles.indexOf('admin') != -1) {
    mount(AppLayout, {
      content: <Testpage/>
    }) 
  } else {
    Router.go('login')
  }

  }
})
