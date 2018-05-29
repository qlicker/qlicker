// QLICKER
// Author: Enoch T <me@enocht.am>
//
// images.js: JS related to image collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Questions } from './questions'

import { check, Match } from 'meteor/check'
import Helpers from './helpers.js'

import { _ } from 'underscore'

import { Slingshot } from 'meteor/edgee:slingshot'

// expected collection pattern
const imagePattern = {
  _id: Match.Maybe(Helpers.MongoID),
  url: String,
  UID: String
}

// Create Image class
const Image = function (doc) { _.extend(this, doc) }
_.extend(Image.prototype, {
})

// Create image collection
export const Images = new Mongo.Collection('images',
  { transform: (doc) => { return new Image(doc) } })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('images', function () {
    if (this.userId) {
      return Images.find({})
    } else this.ready()
  })
}

/**
 * Meteor methods for images object
 * @module images
 */
Meteor.methods({

  /**
   * inserts a new image
   * @param {Image} image
   * @returns {Image} new image
   */
  'images.insert' (image) {
    check(image, imagePattern)
    const exists = Images.findOne(image._id)
    if (exists) {
      return Meteor.call('images.update', image)
    }
    return Images.insert(image)
  },

  /**
   * updates all image details
   * @param {Image} image
   * @returns {MongoID} id of updated image
   */
  'images.update' (image) {
    check(image, imagePattern)
    return Images.update(image._id, image)
  },

  /**
   * Deletes an image by id
   * @param {MongoId} imageId
   */
  'images.delete' (imageId) {
    check(imageId, Helpers.MongoID)
    return Images.delete({_id: imageId})
  },

  /**
   * Cleans the S3 bucket and mongodb from unused images
   */
  'cleanDB' () {
    if (!Meteor.user().hasRole('admin')) throw new Error('Not authorized')
    var AWS = require('aws-sdk')
    var azure = require('azure-storage')

    AWS.config.update({
      accessKeyId: Meteor.settings.AWSAccessKeyId,
      secretAccessKey: Meteor.settings.AWSSecretAccessKey
    })

    var s3 = new AWS.S3({
      region: Meteor.settings.AWSRegion
    })
    s3.listObjects({Bucket: Meteor.settings.bucket}, Meteor.bindEnvironment((err, data) => {
      if (err) return
      const entries = _.pluck(data.Contents, 'Key')
      const local = _.map(entries, (UID) => {
        return Images.findOne({UID: UID}) || {UID: UID}
      })
      _.each(local, (obj) => {
        let inQuestion
        let inAns
        let asProfile
        if (obj.UID) {
          const regex = '.*' + obj.UID.substring(0, obj.UID.indexOf('/')) + '.*'
          inQuestion = Questions.findOne({'content': {$regex: regex}})
          inAns = Questions.findOne({'options.content': {$regex: regex}})
          asProfile = Meteor.users.findOne({'profile.profileImage': {$regex: regex}})
        }
        if (!inQuestion && !inAns && !asProfile) {
          Images.remove(obj)
          s3.deleteObject({Bucket: Meteor.settings.bucket, Key: obj.UID}, (error, data) => {
            if (error) console.log('Error deleting from S3:', error)
          })
        }
      })
    }))
  }

}) // end Meteor.methods
