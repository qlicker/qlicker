
import {FlowRouter} from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
 
//Layouts and Pages
import { AppLayout } from '../../ui/layouts/app_layout'
import { Homepage } from '../../ui/pages/homepage' 
import { Loginpage } from '../../ui/pages/loginpage'
import { Testpage } from '../../ui/pages/testpage'

FlowRouter.route('/', {
  name: 'homepage',
  action() {
    mount(AppLayout, {
      content: <Homepage />
    })
  }
})


FlowRouter.route('/login', {
  name: 'loginpage',
  action() {
    mount(AppLayout, {
      content: <Loginpage/>
    })
  }
})

FlowRouter.route('/testpage', {
  name: 'testpage',
  action() {
    if (!Meteor.userId()) {
      FlowRouter.go('loginpage')
    }
    mount(AppLayout, {
      content: <Testpage/>
    })
  }
})
