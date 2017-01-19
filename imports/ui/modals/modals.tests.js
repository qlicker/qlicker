// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for Modal components found in imports/ui/modals

import { Factory } from 'meteor/dburles:factory'
import React from 'react'
import { shallow, mount } from 'enzyme'
import { chai, expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'

import { CreateCourseModal, DEFAULT_STATE } from './CreateCourseModal.jsx'

if (Meteor.isClient) {
 
  describe('CreateCourseModal', () => {
  
    it('should render', () => {
      const NUM_INPUTS = _.keys(DEFAULT_STATE).length + 1
      const modal = shallow(<CreateCourseModal />)
      chai.assert(modal.hasClass('ui-modal-createcourse'))
      chai.assert(modal.find('.ui-form-createcourse'))
      chai.assert.equal(modal.find('input').length, NUM_INPUTS)
    })

    it('should update state on input change', () => { 
      /*
      const TEST_VALUE = 'test value'
      const onDone = sinon.spy()
      
      const modal = shallow(<CreateCourseModal done={onDone} />)
      const textInput = modal.find('input[type="text"]')
      const submit = modal.find('input[type="submit"]')

      //textInput.simulate('focus')
      ///textInput.simulate('change', {
      //  target: { value: TEST_VALUE }
      //})

      // check each key in state 
      //_.keys(DEFAULT_STATE).forEach((k) => {
      //  console.log(modal.state()[k])
      //  expect(modal.state()[k]).to.equal(TEST_VALUE);        
      //})

      submit.get(0).click()
      //submit.sumulate('click')
      expect(onDone.calledOnce).to.equal(true);    
      */
    })
  
  }) // end describe('CreateCourseModal')

}
