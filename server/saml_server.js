import { Meteor } from 'meteor/meteor'
import { Settings } from '../imports/api/settings.js'


import Fiber from 'fibers'
import bodyParser from 'body-parser'
import saml from 'passport-saml'
import url from 'url'
import xmldom from 'xmldom'
import xpath from 'xpath'
import _ from 'underscore'

//console.log(Meteor.absoluteUrl())

settings = Settings.findOne({})

//Only if SSO is enabled, set things up
//These setting take effect only after restarting the app, if the SSO is enabled/disabled
if(settings && settings.SSO_enabled && settings.SSO_emailIdentifier && settings.SSO_entrypoint && settings.SSO_identifierFormat && settings.SSO_EntityId ){

//Create a passport-saml strategy using the given settings
//User is responsible for creating a private key and corresponding certificate and storing them in /private
//note that privateCert is actually a key, the same as decryptionPvk

  strategy = new saml.Strategy({
    callbackUrl: Meteor.absoluteUrl('SSO/SAML2'),
    logoutCallbackUrl: Meteor.absoluteUrl('SSO/SAML2/logout'),// qlicker's logout (for IDP initiated logout)
    entryPoint: settings.SSO_entrypoint, //entry point of IDP
    cert: settings.SSO_cert,// cert of IDP
    identifierFormat: settings.SSO_identifierFormat,//nameID format
    logoutUrl: (settings.SSO_logoutUrl ? settings.SSO_logoutUrl : ''),// IDP logout url (to initiate IDP logout)
    decryptionPvk: (settings.SSO_privKey ? settings.SSO_privKey : ''),//Assets.getText('key.key'),//local private key for decryption
    issuer: settings.SSO_EntityId,//same of the entity id (Qlicker)
    },
    function(profile, done) {
    return done(null, profile);
  })

  //Create a saml object inside of Accounts
  if (!Accounts.saml) {
    Accounts.saml = {};
  }
  //Store the strategy there (although it never gets called outside of this file)
  Accounts.samlStrategy = strategy

  //LoginResultForCredentialToken stores {token: {profile, nameID, sessionIndex}}
  //The token is created by the client, passed as RelayState to the IDP, and then
  //accessed again on the server; this is how the server know the request from the IDP
  //goes with a particular client login attempt
  Accounts.saml._loginResultForCredentialToken = {};

  //Inserted during IdP -> SP Callback
  Accounts.saml.insertCredential = function (credentialToken, samlInfo) {
    Accounts.saml._loginResultForCredentialToken[credentialToken] = samlInfo;
  }

  //Retrieved in account login handler
  Accounts.saml.retrieveCredential = function(credentialToken) {
    let samlInfo = Accounts.saml._loginResultForCredentialToken[credentialToken];
    delete Accounts.saml._loginResultForCredentialToken[credentialToken];
    return samlInfo;
  };

  //Register a login handler with Meteor (gets called by client, in loginWithSaml through
  //Accounts.callLoginMethod)
  Accounts.registerLoginHandler(function (loginRequest) {
    //Check if the login request is consistent with an SSO request
    if (loginRequest.credentialToken && loginRequest.saml) {
      const samlInfo = Accounts.saml.retrieveCredential(loginRequest.credentialToken);
      if (samlInfo) {
        //Try to find a user based on the SAML email addresss, otherwise, create a new user
        const samlProfile = samlInfo.profile
        let userId = null
        let user = Accounts.findUserByEmail(samlProfile.email)
        let profile = (user && user.profile) ? user.profile : samlProfile
        let services = (user && user.services ) ? user.services : {}
        let sessions = (user && user.services && user.services.sso && user.services.sso.sessions) ? user.services.sso.sessions : []

        console.log("register login handler")
        console.log(samlInfo)
        console.log(samlProfile)
        console.log(user)
        console.log(profile)
        console.log(services)
        // Remove old sessions from sso sessions (done automatically for resume.loginTokens)
        // Remove sessions that do not have an associated token in resume.loginTokens
        let resumeTokens = (user && user.services && user.services.resume && user.services.resume.loginTokens) ? _(user.services.resume.loginTokens).pluck('hashedToken')  : []
        sessions = _(sessions).filter(function( s ){ return _(resumeTokens).contains(s.loginToken) } )

        services.sso = {  id: samlInfo.nameID,
                          sessions: sessions,
                          nameIDFormat: samlInfo.nameIDFormat,
                          nameID:samlInfo.nameID,
                          email: samlProfile.email,
                          SSORole: samlInfo.SSORole,
                          studentNumber:samlInfo.studentNumber
                       }

        if(user){
          //existing user, update their profile
          userId = user._id
          for (key in samlProfile){
            profile[key] = samlProfile[key]
          }


          //Update role if needed (only upgrade to professor, don't downgrade to student as it could be an account that was promoted):
          if (settings.SSO_roleProfName && samlInfo.SSORole && samlInfo.SSORole === settings.SSO_roleProfName && !profile['roles'].includes('professor')){
            profile['roles'] = ['professor']
          }

          //Note that it will not actually update the email address (except to change the case), since the user was found by email address
          Meteor.users.update(userId, {$set: {email: profile.email.toLowerCase(),
                                              emails: [ { address: profile.email, verified: true } ],
                                              profile: profile,
                                              services: services
                                              }
                                      });
        } else {//new user
          if (settings.SSO_roleProfName && samlInfo.SSORole && samlInfo.SSORole === settings.SSO_roleProfName){
            profile.roles = ['professor']
          } else {
            profile.roles = ['student']
          }
          userId = Accounts.createUser({
                   email: profile.email.toLowerCase(),
                   password: Random.secret(),//user will need to reset password to set it to something useful!
                   profile: profile
                 })
          Meteor.users.update(userId, {$set: { emails: [ { address: profile.email, verified: true } ], services: services} })
        }
        //By adding a stamped token, the user gets logged in
        let stampedToken = Accounts._generateStampedLoginToken()
        let hashStampedToken = Accounts._hashStampedToken(stampedToken)
        //Need to associate each SSO login session with the corresponding login token, so that we can
        //easily log out the correct session.
        let newSession = { sessionIndex: samlInfo.sessionIndex,
                           loginToken: hashStampedToken.hashedToken,
                         }

        Meteor.users.update(userId, { $push: { 'services.sso.sessions': newSession } } )
        Accounts._insertLoginToken(userId, stampedToken);

        return {  userId: userId,
                  token: stampedToken.token,
                  tokenExpires: stampedToken.when,
                  stampedLoginToken: stampedToken
                }

        } else {
          throw new Error("Could not find a profile with the specified credentialToken.");
      }
    }
  })

  //This method provides a link to the SSO logout with the required SAML request.
  //This is the link that goes with the Logout From SSO button in page_container
  //This is based on what was done in https://github.com/lucidprogrammer/meteor-saml-sp/blob/master/src/server/samlServerHandler.js
  //Each user session has a login token stored in the LocalStorage of their browswer. The token, when hashed,
  //is the same as the one in resume.loginToken.
  Meteor.methods({
   "getSSOLogoutUrl": (token) => {
      if (settings.SSO_logoutUrl === '') return null
      user = Meteor.user()
      if (!user || !user.services || !user.services.sso || !user.services.sso.sessions || user.services.sso.sessions.length < 1) return null
      let hashedToken =  Accounts._hashLoginToken(token)
      let session = _(user.services.sso.sessions).findWhere( {loginToken:hashedToken} )
      if (!session) return null
      let sessionIndex = session.sessionIndex

      var getLogoutLinkSync =  Meteor.wrapAsync(getSSLogoutAsync);
      var result = getLogoutLinkSync(user, sessionIndex);
      return result;
    },
    "isSSOSession": (token) =>{
      user = Meteor.user()
      let hashedToken =  Accounts._hashLoginToken(token)
      //return (user && user.services && user.services.sso && user.services.sso.sessions && user.services.sso.sessions.length)
      // TODO This is WRONG; needs to identify which session this is!!!!
      return (user && user.services && user.services.sso && user.services.sso.sessions && _(user.services.sso.sessions).findWhere( {loginToken:hashedToken} ))
    }
  })

  let getSSLogoutAsync = function(user, sessionIndex, callback){
      //This will not be the correct session index!!!!
      let request  = {user : {nameID : user.services.sso.id , nameIDFormat: user.services.sso.nameIDFormat, sessionIndex:sessionIndex}  };
      let getLogout = Accounts.samlStrategy._saml.getLogoutUrl(request, function(error,url){
         if(error) console.log(error);
         callback(null,url)
       })
  }

  //Add server side routes to handle the SSO stuff
  WebApp.connectHandlers
    .use(bodyParser.urlencoded({ extended: false }))
    .use('/SSO/SAML2', function(req, res, next) {
      Fiber(function() {
        try {
          if (req.method === 'GET') {
            // send the metadata if metadata is in the path
            if (url.parse(req.url).pathname === '/metadata' || url.parse(req.url).pathname === '/metadata.xml') {
              res.writeHead(200, {'Content-Type': 'application/xml'});
              const decryptionCert = settings.SSO_privCert ? settings.SSO_privCert : ''//Assets.getText('cert.cert');
              res.end(Accounts.samlStrategy._saml.generateServiceProviderMetadata(decryptionCert), 'utf-8');
            } else {
              // Otherwise redirect to IdP for login (SP -> IdP) (IDP responds with a POST handled below)
              // This route gets called by the login popup window - otherwise, the RelayState will not be set.
              Accounts.samlStrategy._saml.getAuthorizeUrl(req, function (err, result) {
                res.writeHead(302, {'Location': result});
                res.end();
              });
            }
          }
          // POST callback from IdP (IdP -> SP) to either logout or login
          else if (req.method === 'POST') {
            console.log("got post")
            console.log(req)
            console.log(req.url)
            console.log(url.parse(req.url))

            if (url.parse(req.url).pathname === '/logout') {
              console.log("logging out")
              //----------- Hack start
              //A hack to bypass the SSO stuff and log the user out using the SessionIndex in the IDP POST request
              //(needed because passport-saml cannot validate the encrypted response)
              //WARNING: This does not check that the POST came from the IDP
              let xml = Buffer.from(req.body.SAMLRequest, 'base64').toString('utf8') //new Buffer(req.body.SAMLRequest, 'base64').toString('utf8'); // Buffer.from(req.body.SAMLRequest, 'base64').toString('utf8')
              let dom = new xmldom.DOMParser().parseFromString(xml);
              //let sessionIndex = xpath(dom, "/*[local-name()='LogoutRequest']/*[local-name()='SessionIndex']/text()")[0].data;

              //TODO: Not sure if the "saml2p:" prefix is necessary or if it's specific to Queen's University. For Queen's this does not work without.
              let sessionIndex = dom.getElementsByTagName("saml2p:SessionIndex")[0].childNodes[0].nodeValue
              console.log("xml in hack")
              console.log(xml)
              console.log("dom")
              console.log(dom)

              let user = Meteor.users.findOne({ 'services.sso.sessions.sessionIndex':sessionIndex })

              if(user){ //remove the session ID and the login token
                let resumetokens = user.services.resume.loginTokens
                let sessions = user.services.sso.sessions
                let session = _(sessions).findWhere( {sessionIndex:sessionIndex} )
                let sessionToken = session.loginToken

                console.log("sessions and tokens before")
                console.log(sessions)
                console.log(resumetokens)
                console.log("Need to remove session index: "+sessionIndex)
                console.log("with token: "+sessionToken)
                //sessions = _(sessions).reject( function(ses){return ses.sessionIndex == sessionIndex}  )
                //resumetokens = _(resumetokens).reject(  function(rt){return rt.hashedToken == sessionToken} )
                //console.log("sessions and tokens after")
                //console.log(sessions)
                //console.log(resumetokens)
                //Meteor.users.update({_id:user._id},{ $set: {'services.sso.sessions':sessions, 'services.resume.loginTokens' : resumetokens} })

              }
                //console.log(user)
              res.writeHead(302, {'Location': Meteor.absoluteUrl('login')});//this does not work, probably need a different response
              res.end()
              //----------- Hack end
              //The code below should be used instead of the hack above!!! It should work if we disable encryption
              //on nameID, but we can't figure out how to do this... Passport-saml doesn't know how to validate a POST
              //request if it is encrypter (they have a PR to implement it the same way they validate POST response, as in login)
              /* START HERE */
              Accounts.samlStrategy._saml.validatePostRequest(req.body, function(err, result){
                if(!err){ //based on https://github.com/lucidprogrammer/meteor-saml-sp/blob/master/src/server/samlServerHandler.js
                  console.log("validating post request")
                  console.log(result)
                  let user = Meteor.users.findOne({ 'services.sso.session.sessionIndex':result['sessionIndex'] })
                  if(user){ //remove the session ID and the login token
                    console.log(user)
                    Meteor.users.update({_id:user._id},{ $set: {'services.sso.session': {}, 'services.resume.loginTokens' : [] } })
                  }
                  Accounts.samlStrategy._saml.getLogoutResponseUrl(req, function(err, logout){
                    if(error) throw new Error("Unable to generate logout response url");
                    res.writeHead(302, {'Location': logout});
                    res.end()
                  })
                } else {
                 console.log(err)
                 console.log(result)
                }
              }) /*END HERE*/ // end of validate post request

            } else {//POST request for login:
              Accounts.samlStrategy._saml.validatePostResponse(req.body, function (err, result) {
                if (!err) {
                  console.log("login post result")
                  console.log(result)
                  let email = result[settings.SSO_emailIdentifier] //settings.SSO_emailIdentifier has to be specified (see if at top)
                  let firstname = settings.SSO_firstNameIdentifier ? result[settings.SSO_firstNameIdentifier] : 'Brice'
                  let lastname = settings.SSO_lastNameIdentifier ? result[settings.SSO_lastNameIdentifier] : 'de Nice'
                  let SSORole = settings.SSO_roleIdentifier ? result[settings.SSO_roleIdentifier] : ''
                  let studentNumber = settings.SSO_studentNumberIdentifier ? result[settings.SSO_studentNumberIdentifier] : ''
                  console.log(SSORole)
                  profile = {email:email, firstname:firstname, lastname:lastname}

                  Accounts.saml.insertCredential(req.body.RelayState, {profile:profile,
                                                                       sessionIndex:result['sessionIndex'],
                                                                       nameID: result.nameID,
                                                                       nameIDFormat: result.nameIDFormat,
                                                                       SSORole:SSORole, studentNumber:studentNumber
                                                                      } );

                  res.writeHead(200, {'Content-Type': 'text/html'});
                  res.end("<html><head><script>window.close()</script></head></html>'", 'utf-8');
                } else {
                    //console.log(err)
                  //res.writeHead(500, {'Content-Type': 'text/html'});
                  //res.end("An error occured in the SAML Middleware process.", 'utf-8');
                }
              }) // end validatePostReponse
            }
          }
        // Ignore requests that aren't for SAML.
        else {
          next();
          return;
        }
      } catch (err) {
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end("An error occured in the SAML Middleware process.", 'utf-8');
      }
    }).run();//end of the fibre
  })//end of use(/SSO/SAML2)

} //end of if SSO enabled
