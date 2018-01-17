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
  // This creates a fake storage service. Every time Slingshot is used to upload a file,
  // Meteor should throw an error. This could turn into a bootstrapper for storing images
  // into MongoDB if a user does not want to use s3.

  let fakeStorageService = {
    directiveMatch: {},
    directiveDefault: {
      authorize: function (file, metaContext) {
        throw new Meteor.Error('no-s3-credentials', 'Missing S3 credentials. Are you in a dev environment?')
      },
      maxSize: null,
      allowedFileTypes: null
    },
    upload: function (method, directive, file, meta) {}
  }

  Slingshot.createDirective('QuestionImages', fakeStorageService, {})

  console.warn(
    'WARNING: ' +
    'Missing S3 credentials in meteor settings. File uploading' +
    ' will not work. This is fine if you are doing some sort of minor' +
    ' testing. Do NOT deploy if you are seeing this message in prod!')
}
