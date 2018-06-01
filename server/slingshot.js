import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

import { Settings } from '../imports/api/settings.js'

/**
 * Directive names correspond to storageType property in Settings.js
 */


// This creates an AWS S3 storage with no credentials
// Credentials can be changed in admin_dashboard

Slingshot.createDirective('AWS', Slingshot.S3Storage, {
  
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

let azureBlobStorageService = {
  directiveMatch: {
    accountName: String,
    accountKey: String,
    containerName: String,
    options: Object
  },

  /**
   * Here you can set default parameters that your service will use.
   */

  directiveDefault: {
    options: {}
  },


  /**
   *
   * @param {Object} method - This is the Meteor Method context.
   * @param {Object} directive - All the parameters from the directive.
   * @param {Object} file - Information about the file as gathered by the
   * browser.
   * @param {Object} [meta] - Meta data that was passed to the uploader.
   *
   * @returns {UploadInstructions}
   */

  upload: function (method, directive, file, meta) {

    var accountName = directive.accountName
    var accountKey = directive.accountKey
    var containerName = directive.containerName

    var azure = require('azure-storage')
    var blobService = azure.createBlobService(accountName, accountKey)

    blobService.createContainerIfNotExists(containerName, {
      publicAccessLevel: 'blob'
    }, function(error, result, response) {
      if (!error) console.log('Container Created')
      else console.log(error)
    })

    var rawdata = meta.src
    var matches = rawdata.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    var type = matches[1];
    var buffer = new Buffer(matches[2], 'base64')

    blobService.createBlockBlobFromText(containerName, meta.UID, buffer, {contentType:type}, function (error) {
      if(!error) console.log('Blob Created')
      else console.log(error)
    })
    
    return {
      // Endpoint where the file is to be uploaded:
      upload: "",

      // Download URL, once the file uploaded:
      download: "https://" + accountName + ".blob.core.windows.net/" + containerName + "/" + meta.UID,

      // POST data to be attached to the file-upload:
      postData: [
        {
          name: "accountKey",
          value: accountKey
        },
        {
          name: "accountName",
          value: accountName
        },
        {
          name: "containerName",
          value: containerName
        },
      ],

      // HTTP headers to send when uploading:
      headers: {}
    }
  },
  
  /**
   * Absolute maximum file-size allowable by the storage service.
   */

  maxSize: 5 * 1024 * 1024 * 1024
}

Slingshot.createDirective('Azure', azureBlobStorageService, {
  
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  maxSize: 1024 * 1024,
  accountName: '',
  accountKey: '',
  containerName: '',

  authorize: function (file, metaContext) {
    if (file.size > (Settings.findOne().maxImageSize * 1024 * 1024)) {
      alertify.error('Image too large')
      return false
    }
    return Meteor.userId()
  }
})

let fakeStorageService = {
  directiveMatch: {},
  directiveDefault: {
    authorize: function (file, metaContext) {
      throw new Meteor.Error('Image Uploading Unspecified')
    },
    maxSize: null,
    allowedFileTypes: null
  },
  upload: function (method, directive, file, meta) {
    throw new Meteor.Error('Image Uploading Unspecified')
  }
}

Slingshot.createDirective('None', fakeStorageService, {})
