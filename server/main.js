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
      SSO_enabled: false,
      SSO_entrypoint: '',
      SSO_logoutUrl: '',
      SSO_EntityId: '',
      SSO_cert: '',
      SSO_privCert: '',
      SSO_privKey: '',
      SSO_identifierFormat: '',
      SSO_emailIdentifier: '',
      SSO_firstNameIdentifier: '',
      SSO_lastNameIdentifier:'',
      SSO_institutionName: '',
      SSO_roleIdentifier: '',
      SSO_studentNumberIdentifier: '',
      SSO_roleProfName: ''
    })
  } else {
    const settings = Settings.findOne()
    if (settings.storageType === 'AWS') {
      let directive = Slingshot.getDirective(settings.storageType)._directive
      if (!directive) throw new Error('No Directive')
      directive.bucket = settings.AWS_bucket
      directive.region = settings.AWS_region
      directive.AWSAccessKeyId = settings.AWS_accessKey
      directive.AWSSecretAccessKey = settings.AWS_secret
    }
    else if (settings.storageType === 'Azure') {
      let directive = Slingshot.getDirective(settings.storageType)._directive
      if (!directive) throw new Error('No Directive')
      directive.accountName = settings.Azure_accountName
      directive.accountKey = settings.Azure_accountKey
      directive.containerName = settings.Azure_containerName
    } else {
      Settings.update(settings._id, {$set : {storageType:'None'} })
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


  //console.log("URL: "+Meteor.absoluteUrl())
  //********************************
  //Hack to update database of profile pictures
  /*
  allUsers = Meteor.users.find().fetch()
  nusers = allUsers.length
  //console.log(nusers)
  for (let  i=0; i<nusers; i++){
    let user = allUsers[i]
    let profile = user.profile.profileImage
    let thumb = user.profile.profileThumbnail
    if(!thumb || !profile) continue
    let cutprofile = profile.slice(0,-5)
    let cutthumb = thumb.slice(0,-9)

    console.log(cutthumb === cutprofile)

    if(cutthumb !== cutprofile){
      console.log(cutprofile)
      console.log(cutthumb)
      console.log(user)
      thumb = cutprofile + 'thumbnail'
      Meteor.users.update( {_id:user._id}, {'$set' :{
          'profile.profileThumbnail':thumb}
          })
    }

    //console.log(user.profile.lastname)
    if(user.profile.profileImage && !user.profile.profileThumbnail){
      //console.log('   '+user.profile.firstname)
      if(user.profile.profileImage.startsWith('https://ql-images-1.s3-ca-central-1.amazonaws.com') && !user.profile.profileImage.endsWith('/image') ){
          //console.log(" ... updating")
          let url = user.profile.profileImage
          Meteor.users.update( {_id:user._id}, {'$set' :{
              'profile.profileImage': url+'/image',
              'profile.profileThumbnail':url+'/thumbnail'}
              })
      }
    }

  }
  /*
  //Hack to update database of images
  allImages = Images.find().fetch()
  nImages = allImages.length

  for (let  i=0; i<nImages; i++){
    let image = allImages[i]
    if(image.url.startsWith('https://ql-images-1.s3-ca-central-1.amazonaws.com') && !image.url.endsWith('/image') && !image.url.endsWith('/thumbnail')){
      let url = image.url
      Images.update( {UID:image.UID}, {'$set' :{'image.url': url+'/image'}})
    }
    if(image.url.startsWith('https://ql-images-1.s3-ca-central-1.amazonaws.com') && image.url.endsWith('/thumbnail/image') ) {
      let url = image.url.replace('/thumbnail/image','/image')
      Images.update( {UID:image.UID}, {'$set' :{'image.url': url}})
    }
  }
  */
  //End of hack*******************************************************************
})
