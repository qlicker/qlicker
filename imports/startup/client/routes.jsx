
import {FlowRouter} from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
 
//Layouts and Pages
import { AppLayout } from '../../ui/layouts/app_layout'
import { Homepage } from '../../ui/pages/home' 
import { Loginpage } from '../../ui/pages/login'
import { Testpage } from '../../ui/pages/test'

FlowRouter.route('/', {
  name: 'home',
  action() {
    mount(AppLayout, {
      content: <Homepage />
    })
  }
})


FlowRouter.route('/login', {
  name: 'login',
  action() {
    mount(AppLayout, {
      content: <Loginpage/>
    })
  }
})

FlowRouter.route('/testpage', {
  name: 'test',
  action() {
    if (!Meteor.userId()) {
      FlowRouter.go('loginpage')
    }
    mount(AppLayout, {
      content: <Testpage/>
    })
  }
})
