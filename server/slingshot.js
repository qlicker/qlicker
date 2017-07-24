import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

Slingshot.createDirective('QuestionImages', Slingshot.S3Storage, {
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg'],
  maxSize: 1 * 1024 * 1024, // 1MB
  bucket: Meteor.settings.bucket,
  acl: 'public-read',

  authorize: function (file, metaContext) {
    return Meteor.user().hasGreaterRole('professor')
  },

  key: function (file, metaContext) {
    return file.name + '_' + (new Date()).getTime()
  }
})
