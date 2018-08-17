import { Meteor } from 'meteor/meteor'

import '../imports/api/users.js'
import { Sessions } from '../imports/api/sessions.js'
import { Questions } from '../imports/api/questions.js'
import { Responses } from '../imports/api/responses.js'
import { Images } from '../imports/api/images.js'
import { Grades } from '../imports/api/grades.js'

import { Settings } from '../imports/api/settings.js'

Meteor.startup(() => {
  if (!Settings.findOne()) {
    Settings.insert({restrictDomain: false,
      allowedDomains: [],
      maxImageSize: 3,
      maxImageWidth: 700, // ROOT_URL can be https://qlicker.org:3000/ or htpps://qlicker.org/:
      email: 'admin@' + process.env.ROOT_URL.split('//')[1].split(':')[0].split('/')[0],
      requireVerified: false,
      AWS_bucket: '',
      AWS_region: '',
      AWS_accessKey: '',
      AWS_secret: '',
      Azure_accountName: '',
      Azure_accountKey: '',
      Azure_containerName: '',
      storageType: 'None',
    })
  } else {
    const settings = Settings.findOne()
    let directive = {}
    if (settings.storageType === 'AWS') {  
      directive = Slingshot.getDirective(settings.storageType)._directive  
      if (!directive) throw new Error('No Directive')
      directive.bucket = settings.AWS_bucket
      directive.region = settings.AWS_region
      directive.AWSAccessKeyId = settings.AWS_accessKey
      directive.AWSSecretAccessKey = settings.AWS_secret
    }
    if (settings.storageType === 'Azure') {
      directive = Slingshot.getDirective(settings.storageType)._directive
      if (!directive) throw new Error('No Directive')
      directive.accountName = settings.Azure_accountName
      directive.accountKey = settings.Azure_accountKey
      directive.containerName = settings.Azure_containerName
    }
  }

  Questions._ensureIndex({ sessionId: 1 })
  Questions._ensureIndex({ courseId: 1 })
  Questions._ensureIndex({ owner: 1 })
  Responses._ensureIndex({ questionId: 1 })
  Responses._ensureIndex({ studentUserId: 1 })
  Sessions._ensureIndex({ courseId: 1 })
  Images._ensureIndex({ UID: 1 })
  Grades._ensureIndex({ userId: 1 })
  Grades._ensureIndex({ courseId: 1 })
  Grades._ensureIndex({ sessionId: 1 })

})
