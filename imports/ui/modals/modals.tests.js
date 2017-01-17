// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for Modal components found in imports/ui/modals

import { Factory } from 'meteor/dburles:factory';
import React from 'react';
import { shallow } from 'enzyme';
import { chai } from 'meteor/practicalmeteor:chai';


import CreateCourseModal from './CreateCourseModal.jsx';


describe('CreateCourseModal', () => {
  

  it('should render', () => {
    const item = shallow(<CreateCourseModal />)
    chai.assert(item.hasClass('ui-modal-createcourse'))
  });
  
  // TODO various interaction tests

})
