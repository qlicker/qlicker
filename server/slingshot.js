import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

import { Settings } from '../imports/api/settings.js'

// Checks if Meteor settings has the minimum required s3 credentials
// for use with Slingshot.
let hasS3Credentials = !!(Meteor.settings.AWSAccessKeyId &&
    Meteor.settings.AWSSecretAccessKey &&
    Meteor.settings.bucket)

if (hasS3Credentials) {
  Slingshot.createDirective('QuestionImages', Slingshot.S3Storage, {
    allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
    maxSize: null, // Unlimited, handled in authorized() instead
    bucket: Meteor.settings.bucket,
    acl: 'public-read',

    authorize: function (file, metaContext) {
      if (file.size > (Settings.findOne().maxImageSize * 1024 * 1024)) {
        alertify.error('Image too large')
        return false
      }
      return Meteor.userId()
    },

    key: function (file, metaContext) {
      return metaContext.UID + '/' + metaContext.type
    }
  })
} else {
  // This creates an AWS S3 storage with no credentials
  // Credentials can be changed in admin_dashboard

  Slingshot.createDirective('QuestionImages', Slingshot.S3Storage, {
   
    allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
    maxSize: null, // Unlimited, handled in authorized() instead
    bucket: '',
    AWSAccessKeyId: '',
    AWSSecretAccessKey: '',
    acl: 'public-read',

    authorize: function (file, metaContext) {
      if (file.size > (Settings.findOne().maxImageSize * 1024 * 1024)) {
        alertify.error('Image too large')
        return false
      }
      return Meteor.userId()
    },

    key: function (file, metaContext) {
      return metaContext.UID + '/' + metaContext.type
    }
  })

  console.warn(
    'WARNING: ' +
    'Missing S3 credentials in meteor settings. File uploading' +
    ' will not work. This is fine if you are doing some sort of minor' +
    ' testing. Do NOT deploy if you are seeing this message in prod!')
}
