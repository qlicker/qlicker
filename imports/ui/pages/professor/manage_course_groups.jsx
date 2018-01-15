/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../../api/courses'

import { CreateGroupCategoryModal } from '../../modals/CreateGroupCategoryModal'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

import { ROLES } from '../../../configs'


class _ManageCourseGroups extends Component {

  constructor (props) {
    super(props)

    this.state = {
      category:null,
      group:null,
      changingGroupeName:false,
      newGroupName:'',
      showUngroupedStudents:true,
      studentSearchString: ''
    }

    this.setCategory = this.setCategory.bind(this)
    this.setGroup = this.setGroup.bind(this)
    this.setNewGroupName = this.setNewGroupName.bind(this)
    this.toggleChanginGroupName = this.toggleChanginGroupName.bind(this)
    this.changeGroupName = this.changeGroupName.bind(this)
    this.toggleStudentInGroup = this.toggleStudentInGroup.bind(this)
    this.setGroupFromStudent = this.setGroupFromStudent.bind(this)
    this.toggleShowUngoupedStudents = this.toggleShowUngoupedStudents.bind(this)
    this.setStudentSearchString = this.setStudentSearchString.bind(this)
    this.addGroupToCategory = this.addGroupToCategory.bind(this)
    this.incrementGroup = this.incrementGroup.bind(this)

  }

  componentWillReceiveProps (nextProps){
    if (this.state.category){
      // handle the case where the group or category was modified, so update the state
      const newCategory = _(nextProps.course.groupCategories).findWhere({ categoryNumber:this.state.category.categoryNumber })
      if (this.state.group){
        const newGroup = _(newCategory.groups).findWhere({ groupNumber:this.state.group.groupNumber })
        this.setState({ category:newCategory, group:newGroup })
      } else {
        this.setState({ category:newCategory })
      }

    }
  }

  setCategory (option) {
    if(option){
      const category = _(this.props.course.groupCategories).findWhere({ categoryNumber:option.value })
      this.setState({ category:category, group:category.groups[0] })
    } else {
      this.setState({ category:null, group:null })
    }
  }

  setGroup (option) {
    if(option && this.state.category){
      const group = _(this.state.category.groups).findWhere({ groupNumber:option.value })
      if(group) this.setState({ group:group })
    } else {
      this.setState({ group:null })
    }
  }

  setNewGroupName (e) {
    this.setState({ newGroupName:e.target.value })
  }

  toggleChanginGroupName () {
    this.setState({ changingGroupeName:!this.state.changingGroupeName })
  }

  changeGroupName () {
    if( this.state.category && this.state.group && this.state.newGroupName){
      Meteor.call('courses.changeGroupName', this.props.courseId, this.state.category.categoryNumber,
                  this.state.group.groupNumber, this.state.newGroupName,
                  (error) => {
        if (error) return alertify.error(error.err)
        alertify.success('Group name changed')
      })
      this.setState({ changingGroupeName:false, newGroupName:'' })
    }

  }

  toggleStudentInGroup (sId) {
    if( this.state.category && this.state.group ){
      Meteor.call('courses.addRemoveStudentToGroup', this.props.courseId, this.state.category.categoryNumber,
                   this.state.group.groupNumber, sId, (error) => {
        if (error) return alertify.error(error.err)
        alertify.success('Student membership updated')
      })
    }
  }

  setGroupFromStudent (sId) {
    if( this.state.category ){
      let group = null
      this.state.category.groups.forEach( (g)=> {
        if ( _(g.students).contains(sId) ) group = g
      })
      if (group) this.setState({ group:group })
    }
  }

  toggleShowUngoupedStudents () {
    this.setState({ showUngroupedStudents:!this.state.showUngroupedStudents })
  }

  setStudentSearchString (e) {
    this.setState({ studentSearchString: e.target.value })
  }

  addGroupToCategory () {
    if( this.state.category ){
      Meteor.call('courses.addGroupsToCategory', this.props.courseId, this.state.category.categoryName, (error) => {
        if (error) return alertify.error(error.err)
        alertify.success('Added group')
      })
    }
  }

  incrementGroup (index) {
    if( this.state.category ){
      const currentGroupNumber = this.state.group.groupNumber
      const newGroupNumber = currentGroupNumber + index
      const nGroups = this.state.category.groups.length
      if (newGroupNumber <= nGroups  && newGroupNumber > 0){
        const group = this.state.category.groups[newGroupNumber-1]
        if (group) this.setState({ group:group })
      }
    }
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const studentsInCourse = this.props.course.students
    let categoryOptions = []
    const groupCategories = this.props.course.groupCategories ? this.props.course.groupCategories : []
    const toggleCreateCategory = () => { this.setState({ categoryModal: !this.state.categoryModal }) }

    groupCategories.forEach( (category) => {
      categoryOptions.push({ value:category.categoryNumber,
                             label:category.categoryName })
    })

    let groupOptions = []
    let studentsInCategory = []
    if (this.state.category){
      this.state.category.groups.forEach( (g) =>{
        groupOptions.push({ value:g.groupNumber,
                            label:g.groupName })
        studentsInCategory = studentsInCategory.concat(g.students)
      })
    }

    const studentsNotInCategory = _(studentsInCourse).filter( (s)=>{return !_(studentsInCategory).contains(s) } )
    let studentsInGroup = this.state.group? this.state.group.students : []

    // Students to show in the student column
    let studentsToShow = studentsInCourse
    let studentsToShowStr = 'All students'
    let addStudentToGroup = false // when true, clicking a student will add them to the selected group, otherwise, it will select the group of that student
    if (this.state.category && this.state.showUngroupedStudents ){
      studentsToShow = studentsNotInCategory
      studentsToShowStr = 'Students not in '+this.state.category.categoryName
      if(this.state.group) addStudentToGroup = true
    }
    if (this.state.category && !this.state.showUngroupedStudents ){
      studentsToShow = studentsInCategory
      studentsToShowStr = 'Students in '+this.state.category.categoryName
    }

    // Filter the list of students to show in student column
    const studentSearchString = this.state.studentSearchString
    studentsToShow = studentSearchString
      ? _(studentsToShow).filter( (entry) => {
        return this.props.students[entry].profile.lastname.toLowerCase().includes(studentSearchString.toLowerCase()) ||
               this.props.students[entry].profile.firstname.toLowerCase().includes(studentSearchString.toLowerCase()) ||
               this.props.students[entry].emails[0].address.toLowerCase().includes(studentSearchString.toLowerCase())
            })
      : studentsToShow

    // Sort the students alphabetically
    studentsToShow = _(studentsToShow).sortBy( (entry) => {return this.props.students[entry].profile.lastname.toLowerCase()})
    studentsInGroup = _(studentsInGroup).sortBy( (entry) => {return this.props.students[entry].profile.lastname.toLowerCase()})

    const nGroups = this.state.category ? this.state.category.groups.length : 0
    const currentGroupNumber = this.state.group ? this.state.group.groupNumber : 0
    const nextGroup = () => this.incrementGroup(1)
    const prevGroup = () => this.incrementGroup(-1)

    return(
      <div className='container ql-manage-course-groups'>
        <div className='row'>
          <div className='col-md-4'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4>Categories</h4>
              </div>
              <div className='ql-card-content'>
                <div className='btn-group btn-group-justified'>
                  <div className='btn btn-default' onClick={toggleCreateCategory}> Create a new category </div>
                  { this.state.categoryModal ? <CreateGroupCategoryModal courseId={this.props.course._id} done={toggleCreateCategory} /> : '' }
                </div>
                { categoryOptions.length
                  ? <div className='ql-manage-course-groups-select'>
                      <Select
                        name='category-input'
                        placeholder='Type to search for a category'
                        value={this.state.category ? this.state.category.categoryNumber : null}
                        options={categoryOptions}
                        onChange={this.setCategory}
                      />
                    </div>
                  : ''
                }
                { groupOptions.length
                  ? <div className='ql-manage-course-groups-select'>
                      <Select
                          name='category-input'
                          placeholder='Type to search for a group'
                          value={this.state.group ? this.state.group.groupNumber : null}
                          options={groupOptions}
                          onChange={this.setGroup}
                      />
                   </div>
                  : ''
                }
                { this.state.category
                  ? <div className='btn-group btn-group-justified'>
                      <div className='btn btn-default' onClick={this.addGroupToCategory}> Add a group to category </div>
                    </div>
                  : ''
                }
              </div>
            </div>
          </div>

          <div className='col-md-4'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4>Group membership</h4>
              </div>
              <div className='ql-card-content'>
                {this.state.group
                  ? <div>
                      <div className='ql-manage-course-groups-group-info'>
                        <div className='ql-manage-course-groups-group-info-row'>
                          Group name:&nbsp;&nbsp;
                          {this.state.changingGroupeName
                            ? <div>
                                <input type='text' onChange={this.setNewGroupName} size="8" placeholder={this.state.group.groupName}></input>
                                &nbsp;&nbsp;
                                <a onClick={this.changeGroupName}>save</a>
                                &nbsp;&nbsp;
                                <a onClick={this.toggleChanginGroupName}>cancel</a>
                              </div>
                            : <div> {this.state.group.groupName}&nbsp;&nbsp; <a onClick={this.toggleChanginGroupName}>change name</a> </div>
                          }
                        </div>
                        { nGroups > 1
                          ? <div className='btn-group btn-group-justified'>
                              <div className='btn-group'>
                                <button className='btn btn-default' onClick={prevGroup} disabled={currentGroupNumber < 2 }>
                                  <span className="glyphicon glyphicon-chevron-left"></span> Previous group
                                </button>
                              </div>
                              <div className='btn-group'>
                                <button className='btn btn-default' onClick={nextGroup} disabled={currentGroupNumber >= nGroups}>
                                  Next group <span className="glyphicon glyphicon-chevron-right"></span>
                                </button>
                              </div>
                            </div>
                          : ''
                        }
                      </div>
                      <div className='ql-simple-studentlist'>
                        <div className='ql-simple-studentlist-info'>
                          ({studentsInGroup.length} student{studentsInGroup.length !== 1 ? 's' :''}) <br />
                          {studentsInGroup.length > 0 ? '(click on a student to remove from group)': ''}
                        </div>
                        <div className='ql-simple-studentlist-student-container'>
                          { studentsInGroup.map( (sId)=>{
                              const onStudentClick =  () => this.toggleStudentInGroup(sId)
                              return(
                                <div key={'s2'+sId} className='ql-simple-studentlist-student' onClick={onStudentClick}>
                                  {this.props.students[sId].profile.lastname}, {this.props.students[sId].profile.firstname} ({this.props.students[sId].emails[0].address})
                                </div>
                              )
                            })
                          }
                        </div>
                      </div>
                    </div>
                  : <div> {this.state.category ? 'Select a group in category': 'Select a category of group'}</div>
                }
              </div>
            </div>
          </div>

          <div className='col-md-4'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4>Students</h4>
              </div>
              <div className='ql-card-content'>
                <div>
                  <div className='ql-manage-course-groups-students-info'>
                    { this.state.category
                      ? <div>
                          <div className='btn-group btn-group-justified'>
                            <div className='btn btn-default' onClick={this.toggleShowUngoupedStudents}>
                              {this.state.showUngroupedStudents ? 'Show students in a group' : 'Show students not in a group'}
                            </div>
                          </div>
                        </div>
                      : ''
                    }
                    <input type='text' onChange={_.throttle(this.setStudentSearchString, 200)} placeholder='Search by student name or email'></input>
                  </div>
                  <div className='ql-simple-studentlist'>
                    <div className='ql-simple-studentlist-info'>
                      {studentsToShowStr} ({studentsToShow.length} student{studentsToShow.length !== 1 ? 's' :''}) <br />
                      {addStudentToGroup ? '(click on a student to add to group)': ''}
                    </div>
                    <div className='ql-simple-studentlist-student-container'>
                      { studentsToShow.map( (sId) => {
                          const onStudentClick = addStudentToGroup
                                                 ? () => this.toggleStudentInGroup(sId)
                                                 : () => this.setGroupFromStudent(sId)
                          return(
                            <div key={'s2'+sId} className='ql-simple-studentlist-student' onClick={onStudentClick}>
                              {this.props.students[sId].profile.lastname}, {this.props.students[sId].profile.firstname}
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>)
    }
  }





export const ManageCourseGroups = createContainer((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('users.studentsInCourse', props.courseId)

  const course = Courses.findOne({ _id: props.courseId })
  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  return {
    course: course,
    students: _(students).indexBy('_id'),
    loading: !handle.ready()
  }

}, _ManageCourseGroups)
