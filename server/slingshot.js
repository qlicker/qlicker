import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

Slingshot.createDirective('QuestionImages', Slingshot.S3Storage, {
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  maxSize: 2 * 1024 * 1024, // 2MB
  bucket: Meteor.settings.bucket,
  acl: 'public-read',

  authorize: function (file, metaContext) {
    return Meteor.user().hasGreaterRole('professor')
  },

  key: function (file, metaContext) {
    return metaContext.UID
  }
})
