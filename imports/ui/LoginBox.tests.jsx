// QLICKER
// Author: Enoch T <me@enocht.am>
//
// LoginBox.tests.jsx: test for Login/Signup form component

import React from 'react'
import { shallow, mount } from 'enzyme'
import { expect } from 'meteor/practicalmeteor:chai'
// import { sinon } from 'meteor/practicalmeteor:sinon'
import { _ } from 'underscore'

import { LoginBox } from './LoginBox.jsx'

if (Meteor.isClient) {
  describe('<LoginBox />', () => {
    const TEST_VALUE = 'test value'
    const NUM_INPUTS_LOGIN = 3
    const NUM_INPUTS_SIGNUP = 6

    it('should render', () => {
      const loginBox = shallow(<LoginBox />)
      expect(loginBox.hasClass('ui-login-box')).to.equal(true)
      expect(loginBox.find('input').length).to.equal(NUM_INPUTS_LOGIN)
    })

    it('should show additional signup fields', () => {
      const login = mount(<LoginBox />)
      expect(login.find('input').length).to.equal(NUM_INPUTS_LOGIN)
      login.find('.ui-switch-form-button').at(0).simulate('click')
      expect(login.find('input').length).to.equal(NUM_INPUTS_SIGNUP)
    })

    it('should update state on input change', () => {
      const loginBox = mount(<LoginBox />)

      loginBox.find('.ui-switch-form-button').at(0).simulate('click')
      const textInput = loginBox.find('input[type="text"]')

      // set all inputs to test value
      _(textInput.length).times((i) => {
        textInput.at(i).get(0).value = TEST_VALUE + i
        textInput.at(i).simulate('change', textInput)

        expect(loginBox.state()[textInput.at(i).get(0).getAttribute('data-name')]).to.equal(TEST_VALUE + i)
      })
    })
  }) // end describe('CreateCourseModal')
}
