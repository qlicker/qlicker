/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for Modal components found in imports/ui/modals

import React from 'react'
import { shallow, mount } from 'enzyme'
import { expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { _ } from 'underscore'

import { CreateCourseModal, DEFAULT_STATE as CREATE_DEFAULT_STATE } from './CreateCourseModal.jsx'
import { EnrollCourseModal, DEFAULT_STATE as ENROLL_DEFAULT_STATE } from './EnrollCourseModal'

if (Meteor.isClient) {
  describe('<CreateCourseModal />', () => {
    const TEST_VALUE = 'test value'
    const NUM_INPUTS = _.keys(CREATE_DEFAULT_STATE).length + 1

    it('should render', () => {
      const modal = shallow(<CreateCourseModal />)
      expect(modal.hasClass('ui-modal-createcourse')).to.equal(true)
      expect(modal.find('input').length).to.equal(NUM_INPUTS)
    })

    it('should update state on input change', () => {
      const modal = mount(<CreateCourseModal />)
      const textInput = modal.find('input[type="text"]')

      // set all inputs to test value
      _(textInput.length).times((i) => {
        textInput.at(i).get(0).value = TEST_VALUE + i
        textInput.at(i).simulate('change', textInput)
      })

      // check each value by key in component state
      let count = 0
      _.keys(CREATE_DEFAULT_STATE).forEach((k) => {
        expect(modal.state()[k]).to.equal(TEST_VALUE + (count++))
      })
    })

    it('should call done callback on submit', () => {
      const onDone = sinon.spy()
      const modal = mount(<CreateCourseModal done={onDone} />)

      modal.find('form').simulate('submit')
      expect(onDone.calledOnce).to.equal(true) // TODO spy verify course sent
    })
  }) // end describe('CreateCourseModal')

  describe('<EnrollCourseModal />', () => {
    const TEST_VALUE = 'test value'
    const NUM_INPUTS = _.keys(ENROLL_DEFAULT_STATE).length + 1

    it('should render', () => {
      const modal = shallow(<EnrollCourseModal />)
      expect(modal.hasClass('ui-modal-enrollcourse')).to.equal(true)
      expect(modal.find('input').length).to.equal(NUM_INPUTS)
    })

    it('should update state on input change', () => {
      const modal = mount(<EnrollCourseModal />)
      const textInput = modal.find('input[type="text"]')

      // set all inputs to test value
      _(textInput.length).times((i) => {
        textInput.at(i).get(0).value = TEST_VALUE + i
        textInput.at(i).simulate('change', textInput)
      })

      // check each value by key in component state
      let count = 0
      _.keys(ENROLL_DEFAULT_STATE).forEach((k) => {
        expect(modal.state()[k]).to.equal(TEST_VALUE + (count++))
      })
    })

    it('should call done callback on submit', () => {
      const onDone = sinon.spy()
      const modal = mount(<EnrollCourseModal done={onDone} />)

      modal.find('form').simulate('submit')
      expect(onDone.calledOnce).to.equal(true) // TODO spy verify course sent
    })
  }) // end describe('EnrollCourseModal')
}
