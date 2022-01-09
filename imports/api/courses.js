// QLICKER
// Author: Enoch T <me@enocht.am>
//
// courses.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import _ from 'underscore'

import Helpers from './helpers.js'
// import { Sessions } from './sessions.js'
import { ROLES } from '../configs'

//video options pattern (should eventually be moved...)
const videoOptionsPattern = {
  urlId: Helpers.NEString, //required to get connection Info
  joined: Match.Maybe([Helpers.MongoID]),//not used in category, since needs to be tracked per group
  apiOptions: Match.Maybe({
    startAudioMuted: Match.Maybe(Boolean),
    startVideoMuted: Match.Maybe(Boolean),
    startTileView: Match.Maybe(Boolean),
    //useWhiteboard: Match.Maybe(Boolean),
    subjectTitle: Match.Maybe(Helpers.NEString),
  })
}

//Note that additional apiOptions can be added by GetConnectionInfo (like subject)
export const default_VideoChat_apiOptions = {
  startAudioMuted: true,
  startVideoMuted: true,
  startTileView: true,
  //useWhiteboard: false,
}

// expected collection pattern
const coursePattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  name: Helpers.NEString, // Information Technology Project (2016-17)
  deptCode: Helpers.NEString, // CISC
  courseNumber: Helpers.NEString, // 498
  section: Helpers.NEString, // 001
  owner: Helpers.MongoID, // mongo db id reference
  enrollmentCode: Helpers.NEString,
  semester: Helpers.NEString, // F17, W16, S15, FW16 etc.
  inactive: Match.Maybe(Boolean),
  students: Match.Maybe([Helpers.MongoID]),
  instructors: Match.Maybe([Helpers.MongoID]),
  sessions: Match.Maybe([Helpers.MongoID]),
  createdAt: Date,
  requireVerified: Match.Maybe(Boolean),
  allowStudentQuestions: Match.Maybe(Boolean),
  videoChatOptions: Match.Maybe( videoOptionsPattern ),
  //videoChatEnabled: Match.Maybe(Boolean),
  //videoChatId: Match.Maybe(Helpers.NEString),
  //requireApprovedPublicQuestions: Match.Maybe(Boolean),
  groupCategories: Match.Maybe([{
    categoryNumber: Match.Maybe(Helpers.Number),
    categoryName: Match.Maybe(Helpers.NEString),
    catVideoChatOptions: Match.Maybe(videoOptionsPattern),
    groups: Match.Maybe([{
      groupNumber: Match.Maybe(Helpers.Number),
      groupName: Match.Maybe(Helpers.NEString),
      students: Match.Maybe([Helpers.MongoID]),
      joinedVideoChat: Match.Maybe([Helpers.MongoID]),//not hidden, so pointless to hide students...
      helpVideoChat:Match.Maybe(Boolean),//whether group has activated help/call button in their video chat
    }])
  }])
}

/////////////////////////////////////////////////////////////
//Default configuration for connection to Jitsi video chat
/////////////////////////////////////////////////////////////
const default_Jitsi_configOverwrite = {
   disableSimulcast: false,
   enableClosePage: false,
   /*prejoinPageEnabled:false,*/
   disableThirdPartyRequests: true,//removes recording ability, etc, but safer
   //etherpad_base: 'https://wbo.ophir.dev/boards/'
}

const default_Jitsi_interfaceConfigOverwrite = {
  filmStripOnly: false,
  HIDE_INVITE_MORE_HEADER: true,
  SHOW_JITSI_WATERMARK: false,
  SHOW_WATERMARK_FOR_GUESTS: false,
  DEFAULT_REMOTE_DISPLAY_NAME: 'Classmate',
  //DEFAULT_BACKGROUND: '#ffffff', //has no effect? needed for WBO?
  TOOLBAR_BUTTONS: [
    'microphone', 'camera', 'desktop', 'fullscreen',
    'fodeviceselection', 'hangup', 'chat',
    'etherpad', 'raisehand', 'participants-pane',
    'videoquality', 'filmstrip', 'settings','select-background',
    'tileview', 'mute-everyone', 'shareaudio', 'sharedvideo'/* 'security'*/
  ],
}
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

// Create course class
export const Course = function (doc) { _.extend(this, doc) }
_.extend(Course.prototype, {
  courseCode: function () {
    return this.deptCode.toLowerCase() + this.courseNumber.toLowerCase()
  },
  courseCodePretty: function () {
    return this.deptCode.toUpperCase() + ' '+ this.courseNumber.toLowerCase()
  },
  fullCourseCode: function () {
    return this.deptCode + ' ' + this.courseNumber + ' - ' + this.section
  },

  videoConnectionInfo: function () {
    //Check if user in course
    const user = Meteor.user()
    if(!user || !(user.isInstructor(this._id) || user.isStudent(this._id)) ) return null

    //check if video options are set
    if (!this.videoChatOptions) return null

    const userInfo = {
        //email: user.getEmail(),
        displayName: user.getNameFL()
    }

    const roomName = this._id+'Qlicker'+this.videoChatOptions.urlId+'all'

    let interfaceConfigOverwrite = default_Jitsi_interfaceConfigOverwrite
    let configOverwrite = default_Jitsi_configOverwrite

    //Configure the conference, using apiOptions
    let apiOptions = this.videoChatOptions.apiOptions
    apiOptions.subjectTitle = 'Course chat'
    if(apiOptions.startVideoMuted) configOverwrite.startWithVideoMuted = true

    let options = {
      roomName: roomName,
      userInfo: userInfo,
      interfaceConfigOverwrite: interfaceConfigOverwrite,
      configOverwrite: configOverwrite
    }
    const connectionInfo = {options:options, apiOptions:apiOptions, courseId:this._id}
    return connectionInfo
  },

  categoryVideoConnectionInfo: function (categoryNumber, groupNumber) {
    //groupNumber is only passed in if user is an instructer (see routes.jsx)
    //Check if video enabled for this category of groups
    //Check if user is in course

    const user = Meteor.user()
    if(!user || !(user.isInstructor(this._id) || user.isStudent(this._id)) ) return null
    const userId = user._id



    if (categoryNumber < 1 || !this.groupCategories) return null
    const category = _(this.groupCategories).find( (c) => {return c.categoryNumber == categoryNumber })

    //Check that video is enabled and that there exists groups
    if (!category.catVideoChatOptions || !category.groups) return null

    const groups = category.groups

    //Find the group
    let group = {}
    if(user.isInstructor(this._id) ){
      group = _(groups).find( (g) =>{return g.groupNumber == groupNumber} )
      if (!group) return null
    } else {
      group = _(groups).find( (g) =>{return g.students.includes(userId)} )

      if (!group) return null
      groupNumber = group.groupNumber
    }

    //Build the connection information
    const userInfo = {
        //email: user.getEmail(),
        displayName: user.getNameFL() //First Last - so that Jitsi makes the correct initials
    }
    const roomName = 'Ql_C_'+this._id+'cat_'+category.categoryName+category.catVideoChatOptions.urlId+'grp_'+group.groupName

    let interfaceConfigOverwrite = default_Jitsi_interfaceConfigOverwrite
    let configOverwrite = default_Jitsi_configOverwrite

    //Configure the conference, using apiOptions
    let apiOptions = category.catVideoChatOptions.apiOptions
    apiOptions.subjectTitle = category.categoryName+': '+group.groupName
    if(apiOptions.startVideoMuted) configOverwrite.startWithVideoMuted = true

    let options = {
      roomName: roomName,
      userInfo: userInfo,
      interfaceConfigOverwrite: interfaceConfigOverwrite,
      configOverwrite: configOverwrite
    }

    const connectionInfo = {options:options,
                            apiOptions:apiOptions,
                            courseId:this._id,
                            categoryNumber:Number(category.categoryNumber),
                            groupNumber:Number(groupNumber),
                            helpVideoChat:group.helpVideoChat
                          }

    return connectionInfo
  }

})

// Create course collection
export const Courses = new Mongo.Collection('courses',
  { transform: (doc) => { return new Course(doc) } })

// data publishing
// TODO implement this to improve perf http://stackoverflow.com/a/21148698 (note from ET)
if (Meteor.isServer) {
  // TODO: where appropriate, switch to this publication!
  Meteor.publish('courses.single', function (courseId) {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      const c = Courses.findOne({ _id: courseId })
      if (!c || !user) return this.ready()

      if (user.hasGreaterRole(ROLES.admin) || user.isInstructor(courseId)) {
        return Courses.find({ _id: courseId })
      } else if (user.isStudent(courseId)) {
        // return Courses.find({ _id:courseId }, { fields: { students: false } })
        let course = Courses.findOne({ _id: courseId })
        const students = [this.userId]
        course.students = students
        course.instructors = []
        if (course.groupCategories) {
          let groupCategories = []
          course.groupCategories.forEach((cat) => {
            cat.groups.forEach((g) => {
              if (_(g.students).contains(this.userId)) {
                groupCategories.push({
                  categoryNumber: cat.categoryNumber,
                  categoryName: cat.categoryName,
                  catVideoChatOptions: cat.catVideoChatOptions,
                  groups: [{
                    groupName: g.groupName,
                    groupNumber: g.groupNumber,
                    students: [this.userId],
                    joinedVideoChat:g.joinedVideoChat,
                    helpVideoChat: g.helpVideoChat
                  }]
                })
              }
            })
          })
          course.groupCategories = groupCategories
        }

        this.added('courses', course._id, course)
        this.ready()

        const cCursor = Courses.find({ _id: courseId })
        const cHandle = cCursor.observeChanges({
          added: (id, fields) => {
            fields.students = [this.userId]
            fields.instructors = []
            // only publish those groups and categories to which this student belongs.
            if (fields.groupCategories) {
              let groupCategories = []
              fields.groupCategories.forEach((cat) => {
                cat.groups.forEach((g) => {
                  if (_(g.students).contains(this.userId)) {
                    groupCategories.push({
                      categoryNumber: cat.categoryNumber,
                      categoryName: cat.categoryName,
                      catVideoChatOptions: cat.catVideoChatOptions,
                      groups: [{
                        groupName: g.groupName,
                        groupNumber: g.groupNumber,
                        students: [this.userId],
                        joinedVideoChat:g.joinedVideoChat,
                        helpVideoChat: g.helpVideoChat
                      }]
                    })
                  }
                })
              })
              fields.groupCategories = groupCategories
            }

            this.added('courses', id, fields)
          },
          changed: (id, fields) => {
            fields.students = [this.userId]
            fields.instructors = []
            // only publish those groups and categories to which this student belongs.
            if (fields.groupCategories) {
              let groupCategories = []
              fields.groupCategories.forEach((cat) => {
                cat.groups.forEach((g) => {
                  if (_(g.students).contains(this.userId)) {
                    groupCategories.push({
                      categoryNumber: cat.categoryNumber,
                      categoryName: cat.categoryName,
                      catVideoChatOptions: cat.catVideoChatOptions,
                      groups: [{
                        groupName: g.groupName,
                        groupNumber: g.groupNumber,
                        students: [this.userId],
                        joinedVideoChat:g.joinedVideoChat,
                        helpVideoChat: g.helpVideoChat
                      }]
                    })
                  }
                })
              })
              fields.groupCategories = groupCategories
            }
            this.changed('courses', id, fields)
          },
          removed: (id) => {
            this.removed('courses', id)
          }
        })

        this.onStop(function () {
          cHandle.stop()
        })
      } else {
        return this.ready()
      }
    } else this.ready()
  })

  Meteor.publish('courses', function () {
    // This handles publishing of student data differently depending on whether
    // the user is an instructor or student of a course. This is somewhat complicated
    // by the fact that a user could be a student in some courses and an instructor
    // for others.

    if (this.userId) {
      let user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin)) {
        return Courses.find()
      } else {
 // could be a student or a prof
        // Initial subscription to existing courses
        const studentCourses = Courses.find({ students: this.userId }).fetch()
        const instructorCourses = Courses.find({ instructors: this.userId }).fetch()
        studentCourses.forEach(c => {
          let course = c
          course.students = [this.userId]
          course.instructors = []

          if (course.groupCategories) {
            let groupCategories = []
            course.groupCategories.forEach((cat) => {
              cat.groups.forEach((g) => {
                if (_(g.students).contains(this.userId)) {
                  groupCategories.push({
                    categoryNumber: cat.categoryNumber,
                    categoryName: cat.categoryName,
                    catVideoChatOptions: cat.catVideoChatOptions,
                    groups: [{
                      groupName: g.groupName,
                      groupNumber: g.groupNumber,
                      students: [this.userId],
                      joinedVideoChat:g.joinedVideoChat,
                      helpVideoChat: g.helpVideoChat
                    }]
                  })
                }
              })
            })
            course.groupCategories = groupCategories
          }
          this.added('courses', c._id, course)
        })
        instructorCourses.forEach(c => {
          this.added('courses', c._id, c)
        })
        this.ready()
        // Watch for changes:
        // courses where user is a student:
        const sCursor = Courses.find({ students: this.userId })
        // courses where user is an instructor:
        const iCursor = Courses.find({ instructors: this.userId })
        const sHandle = sCursor.observeChanges({
          added: (id, fields) => {
            fields.students = [this.userId]
            fields.instructors = []
            // only publish those groups and categories to which this student belongs.
            if (fields.groupCategories) {
              let groupCategories = []
              fields.groupCategories.forEach((cat) => {
                cat.groups.forEach((g) => {
                  if (_(g.students).contains(this.userId)) {
                    groupCategories.push({
                      categoryNumber: cat.categoryNumber,
                      categoryName: cat.categoryName,
                      catVideoChatOptions: cat.catVideoChatOptions,
                      groups: [{
                        groupName: g.groupName,
                        groupNumber: g.groupNumber,
                        students: [this.userId],
                        joinedVideoChat:g.joinedVideoChat,
                        helpVideoChat: g.helpVideoChat
                      }]
                    })
                  }
                })
              })
              fields.groupCategories = groupCategories
            }
            this.added('courses', id, fields)
          },
          changed: (id, fields) => {
            fields.students = [this.userId]
            fields.instructors = []
            // only publish those groups and categories to which this student belongs.
            if (fields.groupCategories) {
              let groupCategories = []
              fields.groupCategories.forEach((cat) => {
                cat.groups.forEach((g) => {
                  if (_(g.students).contains(this.userId)) {
                    groupCategories.push({
                      categoryNumber: cat.categoryNumber,
                      categoryName: cat.categoryName,
                      catVideoChatOptions: cat.catVideoChatOptions,
                      groups: [{
                        groupName: g.groupName,
                        groupNumber: g.groupNumber,
                        students: [this.userId],
                        joinedVideoChat:g.joinedVideoChat,
                        helpVideoChat: g.helpVideoChat
                      }]
                    })
                  }
                })
              })
              fields.groupCategories = groupCategories
            }
            this.changed('courses', id, fields)
          },
          removed: (id) => {
            this.removed('courses', id)
          }
        })
        const iHandle = iCursor.observeChanges({
          added: (id, fields) => {
            this.added('courses', id, fields)
          },
          changed: (id, fields) => {
            this.changed('courses', id, fields)
          },
          removed: (id) => {
            this.removed('courses', id)
          }
        })
        this.onStop(function () {
          sHandle.stop()
          iHandle.stop()
        })
      }
    } else this.ready()
  })
}
// course permissions helper
export const profHasCoursePermission = (courseId) => {
  check(courseId, Helpers.MongoID)
  let course = Courses.findOne({ _id: courseId }) || []
  if (Meteor.user().hasRole(ROLES.admin) ||
    _.indexOf(course.instructors, Meteor.userId()) !== -1 ||
    Meteor.user().isInstructor(courseId)) {
    return
  } else {
    throw new Meteor.Error('not-authorized')
  }
}

/**
 * Meteor methods for courses object
 * @module courses
 */
Meteor.methods({

  /**
   * insert new course object into Courses mongodb Collection
   * @param {Course} course - course object without id
   * @returns {MongoId} id of new course
   */
  'courses.insert' (course) {
    course.enrollmentCode = Helpers.RandomEnrollmentCode()

    check(course, coursePattern)
    if (!Meteor.user().hasRole(ROLES.admin) &&
      !Meteor.user().hasRole(ROLES.prof)) {
      throw new Meteor.Error('not-authorized')
    }

    const admins = _.pluck(Meteor.users.find({'profile.roles': 'admin'}).fetch(), '_id')
    course.deptCode = course.deptCode.toLowerCase()
    course.courseNumber = course.courseNumber.toLowerCase()
    course.semester = course.semester.toLowerCase()
    course.instructors = [Meteor.userId()].concat(admins)

    const c = Courses.insert(course, (e, id) => {
      if (e) alertify.error('Error creating course')
      else {
        Meteor.users.update({'profile.roles': 'admin'}, {$addToSet: { 'profile.courses': id }}, {multi: true})
        Meteor.users.update({ _id: Meteor.userId() }, { // TODO check status before returning
          $addToSet: { 'profile.courses': id }
        })
      }
    })
    return c
  },

  /**
   * deletes course object Courses mongodb Collection
   * @param {MongoID} courseId
   */
  'courses.delete' (courseId) {
    profHasCoursePermission(courseId)

    const course = Courses.find({ _id: courseId }).fetch()[0]
    if (course.students) {
      course.students.forEach((sId) => {
        Meteor.call('courses.removeStudent', courseId, sId)
      })
    }
    course.instructors.forEach((uId) => {
      if (uId !== Meteor.userId()) Meteor.call('courses.removeTA', courseId, uId)
    })

    return Courses.remove({ _id: courseId })
  },

  /**
   * generates and sets a new enrollment code for the course
   * @param {MongoID} courseId
   * @returns {Course} the course in question
   */
  'courses.regenerateCode' (courseId) {
    profHasCoursePermission(courseId)

    const enrollmentCode = Helpers.RandomEnrollmentCode()
    Courses.update({ _id: courseId }, {
      $set: {
        enrollmentCode: enrollmentCode
      }
    })

    return Courses.find({ _id: courseId }).fetch()
  },

  /**
   * verifies validity of code and enrolls student
   * @param {String} enrollmentCode
   */
  'courses.checkAndEnroll' (enrollmentCode) {
    check(enrollmentCode, Helpers.NEString)
    if (Meteor.isServer) {
      const c = Courses.findOne({
        enrollmentCode: enrollmentCode.toLowerCase()
      })

      if (!c) throw new Meteor.Error('code-not-found', 'Couldn\'t enroll in course')

      if (!c.inactive) {
        const hasVerified = _.some(Meteor.user().emails, (email) => email.verified)
        if (c.requireVerified && !hasVerified) {
          throw new Meteor.Error('could-not-enroll', 'Verified email required')
        }
        if(Meteor.user().isInstructor(c._id)) throw new Meteor.Error('could-not-enroll', 'Already an instructor')
        Meteor.users.update({ _id: Meteor.userId() }, { // TODO check status before returning
          $addToSet: { 'profile.courses': c._id }
        })
        Courses.update({ _id: c._id }, {
          $addToSet: { students: Meteor.userId() }
        })
        return c
      }
      throw new Meteor.Error('could-not-enroll', 'Couldn\'t enroll in course')
    }
  },

  /**
   * edits and updates all valid attributes of the course
   * @param {Course} course
   */
  'courses.edit' (course) {
    check(course._id, Helpers.MongoID)
    check(course, coursePattern)
    let courseId = course._id

    profHasCoursePermission(courseId)

    return Courses.update({ _id: courseId }, {
      $set: {
        name: course.name,
        deptCode: course.deptCode.toLowerCase(),
        courseNumber: course.courseNumber.toLowerCase(),
        section: course.section,
        semester: course.semester.toLowerCase(),
        requireVerified: course.requireVerified ,
        allowStudentQuestions: course.allowStudentQuestions,
        //owner: course.owner // this method used to change course owner
      }
    })
  },

  // course<=>user methods

  /**
   * adds a student to course
   * @param {MongoID} courseId
   * @param {MongoId} studentUserId
   */
  'courses.addStudent' (courseId, studentUserId) {
    check(courseId, Helpers.MongoID)
    check(studentUserId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    const user = Meteor.users.findOne({ '_id': studentUserId })
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')

    // not checking if user.profile also contains course, probably should//TODO
    let course = Courses.findOne({ _id: courseId })
    if (course.students.includes(studentUserId)) {
      throw new Meteor.Error('student already in course', 'student already in course')
    }
    if (course.instructors.includes(studentUserId)) {
      throw new Meteor.Error('student already instructor for course', 'student already instructor for course')
    }

    Meteor.users.update({ _id: studentUserId }, {
      $addToSet: { 'profile.courses': courseId }
    })

    return Courses.update({ _id: courseId }, {
      $addToSet: { students: studentUserId }
    })
  },

  /**
   * adds a student to course by email
   * @param {String} email
   * @param {String} courseId
   */
  'courses.addStudentByEmail' (email, courseId) {
    check(email, Helpers.Email)
    check(courseId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    const user = Accounts.findUserByEmail(email) //Meteor.users.findOne({ 'emails.0.address': email })
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')

    // not checking if user.profile also contains course, probably should//TODO
    let course = Courses.findOne({ _id: courseId })
    if (course.students && course.students.includes(user._id)) {
      throw new Meteor.Error('student already in course', 'student already in course')
    }

    if (course.instructors && course.instructors.includes(user._id)) {
      throw new Meteor.Error('student already instructor for course', 'student already instructor for course')
    }

    Meteor.users.update({ _id: user._id }, {
      $addToSet: { 'profile.courses': courseId }
    })

    return Courses.update({ _id: courseId }, {
      '$addToSet': { students: user._id }
    })
  },
  /**
   * adds a TA to a course
   * @param {String} email
   * @param {String} courseId
   */
  'courses.addTA' (email, courseId) {
    check(email, Helpers.Email)
    check(courseId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    const user = Accounts.findUserByEmail(email) //Meteor.users.findOne({ 'emails.0.address': email })
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')

    // not checking if user.profile also contains course, probably should//TODO
    let course = Courses.findOne({ _id: courseId })
    if (course.instructors.includes(user._id)) {
      throw new Meteor.Error('Already instructor for course', 'Already instructor for course')
    }

    Meteor.users.update({ _id: user._id }, {
      $addToSet: { 'profile.courses': courseId }
    })
    Courses.update({ _id: courseId }, {
      $pull: { students: user._id }
    })
    return Courses.update({ _id: courseId }, {
      '$addToSet': { instructors: user._id }
    })
  },

  /**
   * removes a student to course
   * @param {MongoID} courseId
   * @param {MongoId} studentUserId
   */
  'courses.removeStudent' (courseId, studentUserId) {
    check(courseId, Helpers.MongoID)
    check(studentUserId, Helpers.MongoID)

    //Allow students to remove themselves, and instructors to remove students.
    const user = Meteor.user()
    if ( !(user.isInstructor(courseId) || user.hasGreaterRole(ROLES.admin) || user.isStudent(courseId)) ) throw new Meteor.Error('Not authorized', 'Must be in course')
    if (user.isStudent(courseId) && studentUserId !== user._id) throw new Meteor.Error('Not authorized', 'cannot delete other student')


    //profHasCoursePermission(courseId)

    Meteor.users.update({ _id: studentUserId }, {
      $pull: { 'profile.courses': courseId }
    })
    return Courses.update({ _id: courseId }, {
      $pull: { students: studentUserId }
    })
  },

  /**
   * removes a TA from a course
   * @param {MongoID} courseId
   * @param {MongoId} TAUserId
   */
  'courses.removeTA' (courseId, TAUserId) {
    check(courseId, Helpers.MongoID)
    check(TAUserId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    Meteor.users.update({ _id: TAUserId }, {
      $pull: { 'profile.courses': courseId }
    })
    return Courses.update({ _id: courseId }, {
      $pull: { instructors: TAUserId }
    })
  },

  // course<=>session methods

  /**
   * inserts a session into the Session collection and adds it to the course
   * @param {MongoID} courseId
   * @param {Session} session
   * @returns {MongoId} id new session
   */
  'courses.createSession' (courseId, session) {
    profHasCoursePermission(courseId)
    session.courseId = courseId
    const sessionId = Meteor.call('sessions.insert', session)
    Courses.update({ _id: courseId }, {
      $addToSet: { sessions: sessionId }
    })
    return sessionId
  },

  /**
   * deletes the session from collection and removes link from course
   * @param {MongoID} courseId
   * @param {Session} session
   */
  'courses.deleteSession' (courseId, sessionId) {
    check(sessionId, Helpers.MongoID)
    profHasCoursePermission(courseId)
    Courses.update({ _id: courseId }, {
      $pull: { sessions: sessionId }
    })
    return Meteor.call('sessions.delete', courseId, sessionId)
  },
/*
  'courses.publicQuestionsRequireApproval' (courseId) {
    check(courseId, Helpers.MongoID)
    const course = Courses.findOne(courseId)
    const user = Meteor.users.findOne({ _id: this.userId })
    if (user.isInstructor(courseId) || user.isStudent(courseId)) {
      const approved = course.requireApprovedPublicQuestions ? course.requireApprovedPublicQuestions : false
      return approved
    } else return true
  },*/

  /**
   * get tag object for a specific courseid for react multi select component
   * @param {MongoID} courseId
   * @returns {String} tag.value
   * @returns {String} tag.label
   */
  'courses.getCourseCodeTag' (courseId) {
    check(courseId, Helpers.MongoID)
    const course = Courses.findOne(courseId)

    const c = course ? course.courseCode().toUpperCase() : null
    const tag = c ? { value: c, label: c } : null
    return tag
  },
  /**
   * get course code for a specific courseid for react multi select component
   * @param {MongoID} courseId
   * @returns {String} courseCode
   */
  'courses.getCourseCode' (courseId) {
    check(courseId, Helpers.MongoID)
    const course = Courses.findOne(courseId)
    const c = course ? course.courseCode().toUpperCase() : null
    return c
  },
  /**
   * get course code for a specific courseid for react multi select component
   * @param {MongoID} courseId
   * @returns {String} courseCode
   */
  'courses.getCourseCodePretty' (courseId) {
    check(courseId, Helpers.MongoID)
    const course = Courses.findOne(courseId)
    const c = course ? course.courseCodePretty() : null
    return c
  },
  /**
   * get course tags for which user is an instructor and _ids for use in course select componenet
   * @returns {MongoID} obj._id
   * @returns {String} obj.code
   */
  'courses.getCourseTags' () {
    const courses = Courses.find({instructors: Meteor.userId()}).fetch()
    return _.map(courses, (course) => { return {_id: course._id, code: course.courseCode().toUpperCase()} })
  },
  /**
   * get course tags for profile.courses
   * @returns {MongoID} obj._id
   * @returns {String} obj.code
   */
  'courses.getCourseTagsProfile' () {
    const courses = Meteor.user() ? Courses.find({_id: { $in: Meteor.user().profile.courses }}).fetch() : []
    return _.map(courses, (course) => { return {_id: course._id, code: course.courseCode().toUpperCase()} })
  },  /**
   * set inactive attribute based on bool
   * @param {MongoID} courseId
   * @param {Boolean} active
   */
  'courses.setActive' (courseId, active) {
    check(courseId, Helpers.MongoID)
    check(active, Boolean)

    profHasCoursePermission(courseId)

    return Courses.update({ _id: courseId }, {
      $set: {
        inactive: !active
      }
    })
  },

  /**
   * set requireVerified attribute based on bool
   * @param {MongoID} courseId
   * @param {Boolean} active
   */
  'courses.setVerification' (courseId, isRequired) {
    check(courseId, Helpers.MongoID)
    check(isRequired, Boolean)

    profHasCoursePermission(courseId)

    return Courses.update({ _id: courseId }, {
      $set: {
        requireVerified: isRequired
      }
    })
  },
  /**
   * generates and sets a new enrollment code for the course
   * @param {MongoID} courseId
   */
  'courses.toggleAllowStudentQuestions' (courseId) {
    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)
    const previous = course.allowStudentQuestions
    Courses.update({ _id: courseId }, {
      $set: {
        allowStudentQuestions: !previous,
        //requireApprovedPublicQuestions: true
      }
    })
  },

  'courses.hasAllowedStudentQuestions' (courseId) {
    const course = Courses.findOne(courseId)
    if (!course) throw new Error('Course not found')
    const user = Meteor.users.findOne({ _id: this.userId })
    if (user.isInstructor(courseId) || user.isStudent(courseId)) {
      return course.allowStudentQuestions
    } else return false
  },

  /**
   * generates and sets a new enrollment code for the course
   * @param {MongoID} courseId
   */
   /*
  'courses.toggleRequireApprovedPublicQuestions' (courseId) {
    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)
    if (!course) throw new Error('Cannot find course')
    const previous = course.requireApprovedPublicQuestions
    return Courses.update({ _id: courseId }, {
      $set: {
        requireApprovedPublicQuestions: !previous
      }
    })
  },*/

  /**
   * Creates a new category of groups (never used)
   * @param {MongoID} courseId
   * @param {String} categoryName
   */
  /*
  'courses.createGroupCategory' (courseId, categoryName) {
    check(courseId, Helpers.MongoID)
    check(categoryName, Helpers.NEString)
    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)

    console.log(categoryName)
    console.log(_(course.groupCategories).findWhere({ categoryName: categoryName }) )

    if (course.groupCategories && _(course.groupCategories).findWhere({ categoryName: categoryName })) {
      console.log("error here")
      throw new Meteor.Error('Category with this name already exists!')
    }
    let categories = course.groupCategories ? course.groupCategories : []
    let categoryNumber = 5

    categories.push({
      categoryNumber: categories.length + 1,
      categoryName: categoryName,
      groups: []
    })
    Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },*/

  /**
   * Adds a given number of groups to a category (creates the category if it doesn't exist)
   * @param {MongoID} courseId
   * @param {String} categoryName
   * @param {Number} nGroups // number of groups to create
   */
  'courses.addGroupsToCategory' (courseId, categoryName, nGroups = 1) {
    check(courseId, Helpers.MongoID)
    check(categoryName, Helpers.NEString)
    check(nGroups, Number)

    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)

    let categories = course.groupCategories ? course.groupCategories : []

    if (!_(categories).findWhere({ categoryName: categoryName })) {
      //creating new category
      let catNumber = categories.length >0 ? Math.max( _(categories).max( (cat) => {return cat.categoryNumber} ).categoryNumber,
                               categories.length ) + 1
                               : 1
      categories.push({
        categoryNumber: catNumber,
        categoryName: categoryName,
        groups: []
      })
    }
    let category = _(categories).findWhere({ categoryName: categoryName })
    let groups = category.groups

    let offset = groups.length ? Math.max( _(groups).max( (g) => {return g.groupNumber} ).groupNumber,
                             groups.length) + 1 : 1

    for (let ig = 0; ig < nGroups; ig++) {
      const groupNumber = ig + offset
      const groupName = 'Group' + groupNumber.toString()
      const group = {
        groupNumber: groupNumber,
        groupName: groupName,
        students: []
      }
      groups.push(group)
    }
    Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },

  /**
   * Deletes a category by name
   * @param {MongoID} courseId
   * @param {String} categoryName
   *
   */
  'courses.deleteCategory' (courseId, categoryName) {
    check(courseId, Helpers.MongoID)
    check(categoryName, Helpers.NEString)

    profHasCoursePermission(courseId)

    let course = Courses.findOne(courseId)
    let categories = course.groupCategories ? course.groupCategories : []
    categories = _(categories).reject( (cat) => {return cat.categoryName == categoryName} )

    Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },


  /**
   * Adds or removes a student to/from a group (by category and group number)
   * @param {MongoID} courseId
   * @param {MongoID} studentId
   * @param {Number} categoryNumber
   * @param {Number} groupNumber // number of groups to create
   */
  'courses.addRemoveStudentToGroup' (courseId, categoryName, groupNumber, studentId) {
    check(courseId, Helpers.MongoID)
    check(studentId, Helpers.MongoID)
    check(categoryName, Helpers.NEString)
    check(groupNumber, Number)

    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)
    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryName: categoryName })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryName: categoryName })
    let groups = category.groups
    let group = _(groups).findWhere({ groupNumber: groupNumber })
    if (!group) {
      throw new Meteor.Error('Group does not exist!')
    }
    const index = _(group.students).indexOf(studentId)
    if (index === -1) { // add the student
      group.students.push(studentId)
    } else { // removed the student
      group.students.splice(index, 1)
    }
    Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },
  /**
   * Adds or removes a student to/from a group (by category and group number)
   * @param {MongoID} courseId
   * @param {String} newGroupName
   * @param {Number} categoryNumber
   * @param {Number} groupNumber // number of groups to create
   */
  'courses.changeGroupName' (courseId, categoryName, groupNumber, newGroupName) {
    check(courseId, Helpers.MongoID)
    check(newGroupName, Helpers.NEString)
    check(categoryName, Helpers.NEString)
    check(groupNumber, Number)

    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)
    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryName: categoryName })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryName: categoryName })
    let groups = category.groups
    let group = _(groups).findWhere({ groupNumber: groupNumber })
    if (!group) {
      throw new Meteor.Error('Group does not exist!')
    }
    group.groupName = newGroupName
    Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },
  /**
   * Deletes a group
   * @param {MongoID} courseId
   * @param {Number} categoryNumber
   * @param {Number} groupNumber
   */
  'courses.deleteGroup' (courseId, categoryName, groupNumber) {
    check(courseId, Helpers.MongoID)
    check(categoryName, Helpers.NEString)
    check(groupNumber, Number)

    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)
    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryName: categoryName })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryName: categoryName })
    let groups = category.groups
    if (groups.length < 2) {
      throw new Meteor.Error('Must have at least 1 group in category')
    }

    let group = _(groups).findWhere({ groupNumber: groupNumber })
    if (!group) {
      throw new Meteor.Error('Group does not exist!')
    }

    let index = _(groups).findIndex({groupNumber:groupNumber})
    if (index > -1) {
      groups.splice(index, 1);//remove in place (so that pointer doesn't change, since updating categories below)
    }

    Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },

  // Toggle the course video chat
  // Generates a new random urlId each time it's toggled
  'courses.toggleVideoChat' (courseId) {

    check(courseId, Helpers.MongoID)
    profHasCoursePermission(courseId)

    let course = Courses.findOne(courseId)
    if (!course) {
      throw new Meteor.Error('Course does not exist!')
    }

    if (course.videoChatOptions){ //Disable video chat
      Courses.update({ _id: courseId }, {
        $unset: {
          videoChatOptions: '',
        }
      })
    } else { //Enable video chat
      let videoChatOptions = {
        urlId: Helpers.RandomVideoId(), //new random ID each time it's toggled
        joined: [],
      }
      videoChatOptions.apiOptions = default_VideoChat_apiOptions
      Courses.update({ _id: courseId }, {
        $set: {
          videoChatOptions: videoChatOptions,
        }
      })

    }
  },

  // Set the api options for the course video chat (if this is enabled)
  'courses.setApiOptions' (courseId, apiOptions) {

    check(courseId, Helpers.MongoID)
    check(apiOptions, videoOptionsPattern.apiOptions)

    profHasCoursePermission(courseId)

    let course = Courses.findOne(courseId)
    if (!course) {
      throw new Meteor.Error('Course does not exist!')
    }

    if (course.videoChatOptions){ //only set if they exist
      let videoChatOptions = course.videoChatOptions
      videoChatOptions.apiOptions = apiOptions
      Courses.update({ _id: courseId }, {
        $set: {
          videoChatOptions: videoChatOptions,
        }
      })
    } else { //Enable video chat
      throw new Meteor.Error('No videooptions for which to add apiOptions!')
    }
  },

  'courses.toggleCategoryVideoChat' (courseId, categoryNumber) {
    check(courseId, Helpers.MongoID)
    check(categoryNumber, Number)

    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)
    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryNumber: categoryNumber })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryNumber: categoryNumber })

    if (category.catVideoChatOptions) { //Disable video
      Courses.update({ _id: courseId, 'groupCategories.categoryNumber': categoryNumber }, {
        $unset: { //selects the first element in groupCategories that matches the above query...
          'groupCategories.$.catVideoChatOptions' : ''
        }
      })

    } else {
      let videoChatOptions = {
        urlId: Helpers.RandomVideoId(), //new random ID each time it's toggled
        joined: [],//not used in category (have to keep track of each group, use joinedVideoChat instead)
      }
      videoChatOptions.apiOptions = default_VideoChat_apiOptions
      category.catVideoChatOptions = videoChatOptions
      //easier to reset this on enable, to avoid a horrible query to modify an array in an array...

      if(category.groups && category.groups.length > 0){
        for (let ig=0; ig<category.groups.length ;ig++){
          category.groups[ig].joinedVideoChat = []
          category.groups[ig].helpVideoChat = false
        }
      }
      Courses.update({ _id: courseId }, {
        $set: {
          groupCategories: categories
        }
      })
    }
  },
  // Clear the people that have joined and reset the call button for all rooms in the category:
  'courses.clearCategoryRooms' (courseId, categoryNumber) {
    check(courseId, Helpers.MongoID)
    check(categoryNumber, Number)

    profHasCoursePermission(courseId)
    let course = Courses.findOne(courseId)
    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryNumber: categoryNumber })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryNumber: categoryNumber })

    if(category.groups && category.groups.length > 0){
      for (let ig=0; ig<category.groups.length ;ig++){
        category.groups[ig].joinedVideoChat = []
        category.groups[ig].helpVideoChat = false
      }
    }
    Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },
  // Set the api options for the course video chat (if this is enabled)
  'courses.setCategoryApiOptions' (courseId, categoryNumber, apiOptions) {
    check(courseId, Helpers.MongoID)
    check(categoryNumber, Number)
    check(apiOptions, videoOptionsPattern.apiOptions)
    profHasCoursePermission(courseId)

    let course = Courses.findOne(courseId)
    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryNumber: categoryNumber })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryNumber: categoryNumber })

    if (category.catVideoChatOptions) {
      let catVideoChatOptions = category.catVideoChatOptions
      catVideoChatOptions.apiOptions = apiOptions

      Courses.update({ _id: courseId, 'groupCategories.categoryNumber': categoryNumber }, {
        $set: { //selects the first element in groupCategories that matches the above query...
          'groupCategories.$.catVideoChatOptions' : catVideoChatOptions
        }
      })

    } else {
      throw new Meteor.Error('No videooptions for which to add apiOptions!')
    }
  },

  'courses.joinVideoChat' (courseId) {
    check(courseId, Helpers.MongoID)
    const user = Meteor.user()
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')

    if (user.isInstructor(courseId) || user.isStudent(courseId)) {
      return Courses.update({ _id: courseId }, {
        '$addToSet': { 'videoChatOptions.joined': user._id }
      })
    }
  },

  'courses.leaveVideoChat' (courseId) {
    check(courseId, Helpers.MongoID)
    const user = Meteor.user()
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')

    if (user.isInstructor(courseId) || user.isStudent(courseId)) {
      return Courses.update({ _id: courseId }, {
        '$pull': { 'videoChatOptions.joined': user._id }
      })
    }
  },

  'courses.joinCategoryVideoChat' (courseId, categoryNumber, groupNumber) {
    check(courseId, Helpers.MongoID)
    check(categoryNumber, Number)
    check(groupNumber, Number)

    const user = Meteor.user()
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')
    if (!( user.isInstructor(courseId) || user.isStudent(courseId) )) throw new Meteor.Error('Not authorized')
    let course = Courses.findOne(courseId)

    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryNumber: categoryNumber })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryNumber: categoryNumber })
    let groups = category.groups
    let group = _(groups).findWhere({ groupNumber: (groupNumber) })

    if (!group) {
      throw new Meteor.Error('Group does not exist!')
    }
    let joined = group.joinedVideoChat ? group.joinedVideoChat : []

    if (joined.indexOf(user._id) === -1){
      joined.push(user._id)
      group.joinedVideoChat = joined
    }

    //always disable call button when instructor joins
    if ( user.isInstructor(courseId) ) {
      group.helpVideoChat = false
    }

    return Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },

  'courses.leaveCategoryVideoChat' (courseId, categoryNumber, groupNumber) {
    check(courseId, Helpers.MongoID)
    check(categoryNumber, Number)
    check(groupNumber, Number)

    const user = Meteor.user()
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')
    if (!( user.isInstructor(courseId) || user.isStudent(courseId) )) throw new Meteor.Error('Not authorized')
    let course = Courses.findOne(courseId)

    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryNumber: categoryNumber })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryNumber: categoryNumber })
    let groups = category.groups
    let group = _(groups).findWhere({ groupNumber: (groupNumber) })

    if (!group) {
      throw new Meteor.Error('Group does not exist!')
    }
    let joined = group.joinedVideoChat ? group.joinedVideoChat : []

    if (joined.indexOf(user._id) !== -1){
      joined = joined.filter( (a) => {return a !== user._id} )//remove all instances
      group.joinedVideoChat = joined
      if(group.joinedVideoChat.length < 1){
        group.helpVideoChat = false //turn of ask for help when last person leaves!
      }
    }

    return Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },

  'courses.toggleGroupHelpVideoChat' (courseId, categoryNumber, groupNumber) {
    check(courseId, Helpers.MongoID)
    check(categoryNumber, Number)
    check(groupNumber, Number)

    const user = Meteor.user()
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')
    if (!user.isStudent(courseId)) throw new Meteor.Error('Not authorized')
    let course = Courses.findOne(courseId)

    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryNumber: categoryNumber })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryNumber: categoryNumber })
    let groups = category.groups
    let group = _(groups).findWhere({ groupNumber: (groupNumber) })

    if (!group) {
      throw new Meteor.Error('Group does not exist!')
    }

    if (!group.students || !group.students.includes(user._id)) {
      throw new Meteor.Error('Not in group')
    }

    group.helpVideoChat = !group.helpVideoChat

    return Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },
  //Reset the number of people to 0 in the room, and turn off call button
  'courses.clearGroupRoom' (courseId, categoryNumber, groupNumber) {
    check(courseId, Helpers.MongoID)
    check(categoryNumber, Number)
    check(groupNumber, Number)

    const user = Meteor.user()
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')
    if (!user.isInstructor(courseId)) throw new Meteor.Error('Not authorized')
    let course = Courses.findOne(courseId)

    if (!course || !course.groupCategories || !_(course.groupCategories).findWhere({ categoryNumber: categoryNumber })) {
      throw new Meteor.Error('Category does not exist!')
    }
    let categories = course.groupCategories
    let category = _(categories).findWhere({ categoryNumber: categoryNumber })
    let groups = category.groups
    let group = _(groups).findWhere({ groupNumber: (groupNumber) })

    if (!group) {
      throw new Meteor.Error('Group does not exist!')
    }

    group.helpVideoChat = false
    group.joinedVideoChat = []

    return Courses.update({ _id: courseId }, {
      $set: {
        groupCategories: categories
      }
    })
  },
}) // end Meteor.methods

/*
groupCategories: Match.Maybe([{
  categoryNumber: Match.Maybe(Number)
  categoryName: Match.Maybe(Helpers.NEString),
  groups: Match.Maybe([{
    groupNumber: Match.Maybe(Helpers.Number),
    groupName: Match.Maybe(Helpers.NEString),
    students:  Match.Maybe([Helpers.MongoID])
  }])
}]),
*/
