// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ControlledForm.jsx: super class for controlled form components

import React, { Component, PropTypes } from 'react'

import { Settings } from '../api/settings'

import _ from 'underscore'

/**
 * super class for make component with react 'controlled' form. Provided methods for setting and storing value fo controlled form elements usind the data-id attribute.
 */
export class RestrictDomainForm extends Component {

  constructor (props) {
    super(props)

    this.state = _.extend(props.settings, {domain: ''})

    this.setValue = this.setValue.bind(this)
    this.textChange = this.textChange.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.domainClick = this.domainClick.bind(this)
    this.done = this.done.bind(this)
  }

  setValue (e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  done (e) {
    this.props.done()
  }

  handleChange (e) {
    this.setState({ restrictDomain: e.target.checked }, () => {
      Meteor.call('settings.update', _.omit(this.state, 'domain'))
    })
  }

  textChange (e) {
    this.setState({domain: e.target.value})
  }

  domainClick (e) {
    let domain = e.target.innerHTML
    domain = domain.slice(-2) === ', ' ? domain.slice(0, -2) : domain
    this.setState({allowedDomains: _.without(this.state.allowedDomains, domain)}, () => {
      Meteor.call('settings.update', _.omit(this.state, 'domain'))
    })
  }

  handleSubmit (e) {
    e.preventDefault()
    let domain = this.state.domain
    domain = domain.slice(0, 1) === '@' ? domain.slice(1) : domain
    this.state.allowedDomains.push(domain)
    this.setState({allowedDomains: this.state.allowedDomains}, () => {
      Meteor.call('settings.update', _.omit(this.state, 'domain'))
    })
    this.setState({domain: ''})
    this.refs.textInput.value = ''
  }

  render () {
    const domains = this.state.allowedDomains.map((domain, index) => {
      return (
        <span key={'restrict_'+domain} onClick={this.domainClick}>{domain + (index === this.state.allowedDomains.length - 1 ? '' : ', ')}</span>
      )
    })

    return (<div>
      <h4>Restrict signup by domain</h4>
      <form className='form-inline' onSubmit={this.handleSubmit}>
        <input type='checkbox' checked={this.state.restrictDomain} onChange={this.handleChange} />
        { this.state.restrictDomain ? <span>
          <input className='form-control' ref='textInput' type='text' placeholder='example.com' onChange={this.textChange} />
          <input className='btn btn-primary' type='submit' value='Submit' />
          <br />
            Allowed domains (click to remove): {domains}
        </span> : ''}
      </form>
    </div>)
  }

} // end ControlledForm
