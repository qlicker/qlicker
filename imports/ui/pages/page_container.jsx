// QLICKER
// Author: Enoch T <me@enocht.am>
//
// page_container.jsx: generic wrapper for logged in pages

import React, { Component } from 'react'

import { LogoutButton } from '../Buttons'
import ProfileCard from '../ProfileCard'

export default class PageContainer extends Component {

  // constructor (props) {
  //   super(props)
  // }

  render () {
    return (
      <div className='ui-page-container'>
        <div className='ui-top-bar'>
          <a href={Router.routes[Meteor.user().profile.roles[0]].path()} className='ui-wordmark'><h1>Qlicker</h1></a>

          <div className='ui-button-bar'>
            <ProfileCard />
            <LogoutButton redirect='login' />
          </div>
        </div>

        <div className='ui-child-container'>{ this.props.children }</div>

      </div>)
  }

}

