/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// App tests for modal interactions with data methods

// import React from 'react'
// import { mount } from 'enzyme'
// import { expect } from 'meteor/practicalmeteor:chai'
// import { sinon } from 'meteor/practicalmeteor:sinon'
// //import { _ } from 'underscore'

// import { restoreStubs } from '../../../stubs.tests.js'
// import { createAndStubProfessor } from '../../api/courses.tests.js'

// import { CreateCourseModal } from './CreateCourseModal.jsx'
// import { EnrollCourseModal, DEFAULT_STATE as ENROLL_DEFAULT_STATE } from './EnrollCourseModal'

// import { Courses } from '../../api/courses.js'
import '../../api/users.js'

if (Meteor.isServer) { // TODO figure out app-test
  /*
  describe('<CreateCourseModal /> <=> Server', () => {
    const TEST_VALUE = 'test value'

    beforeEach(() => {
      Courses.remove({})
      Meteor.users.remove({})
      restoreStubs()
    })

    it('should submit and add to database', () => {
      const profId = createAndStubProfessor()

      const modal = mount(<CreateCourseModal />)

      const textInput = modal.find('input[type="text"]')

      // set all inputs to test value
      _(textInput.length).times((i) => {
        textInput.at(i).get(0).value = TEST_VALUE + i
        textInput.at(i).simulate('change', textInput)
      })

      modal.find('form').simulate('submit')
      expect(Courses.find({ owner: profId }).count()).to.equal(1)
    })
  }) // describe('<CreateCourseModal /> <=> Server')
  */
}

