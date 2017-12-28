// QLICKER
// Author: Enoch T <me@enocht.am>
//
// AddTAModal.jsx

import React, { PropTypes, Component } from 'react'
import '../../api/users.js'

export class CreateGroupCategoryModal extends Component {

  constructor (props) {
    super(props)
    this.state = { categoryName:'', nGroups:1 }
    this.setNGroups = this.setNGroups.bind(this)
    this.setCategoryName = this.setCategoryName.bind(this)
    this.createCategory = this.createCategory.bind(this)
  }

  setCategoryName (e) {
    this.setState({ categoryName:e.target.value })
  }

  setNGroups (e) {
    const nGroups = parseInt(e.target.value)
    this.setState({ nGroups:nGroups })
  }

  createCategory () {
    if (!this.state.categoryName){
      alertify.error('Specoify category')
      return
    }
    Meteor.call('courses.addGroupsToCategory', this.props.courseId, this.state.categoryName, this.state.nGroups, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('New category created')
      this.props.done()
    })


  }

  render () {
    return (<div className='ql-modal-container'>
      <div className='ql-modal ql-card ql-modal-create-group-category' >
        <div className='ql-modal-header ql-header-bar'><h3>Add a group category</h3></div>
        <div className='ql-card-content'>
          <div className='ql-modal-create-group-category-input'>
            <div>
              Category name: <input type='text' onChange={this.setCategoryName} size="16" value={this.state.categoryName}></input>
            </div>
            <div className='ql-modal-create-group-category-input-number'>
              Number of groups: <input type='number' min={0} onChange={this.setNGroups} maxLength="4" size="4" value={this.state.nGroups}></input>
            </div>
          </div>
          <div className='btn-group btn-group-justified'>
            <div className='btn btn-default' onClick={this.createCategory}> Submit </div>
            <div className='btn btn-default' onClick={this.props.done}> Cancel </div>
          </div>
        </div>
      </div>
    </div>)
  } //  end render

} // end AddTAModal

CreateGroupCategoryModal.propTypes = {
  done: PropTypes.func,
  courseId: PropTypes.string,
}
