/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// images.js: JS related to image collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Questions } from './questions'

import { _ } from 'underscore'

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
    const exists = !!Images.findOne(image._id)
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
    return Images.update(image._id, image)
  },

  /**
   * Deletes an image by id
   * @param {MongoId} imageId
   */
  'images.delete' (imageId) {
    return Images.delete(imageId)
  },

  /**
   * Cleans the S3 bucket and mongodb from unused images
   */
  'cleanDB' () {
    var AWS = require('aws-sdk')

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
        var inQuestion
        var inAns
        if (obj.url) {
          const regex = '.*' + obj.url + '.*'
          inQuestion = Questions.findOne({'content': {$regex: regex}})
          inAns = Questions.findOne({'options.content': {$regex: regex}})
        }
        if (!inQuestion && !inAns) {
          Images.remove(obj)
          s3.deleteObject({Bucket: Meteor.settings.bucket, Key: obj.UID}, (error, data) => {
            if (error) console.log('Error deleting from S3:', error)
          })
        }
      })
    }))
  }

}) // end Meteor.methods
