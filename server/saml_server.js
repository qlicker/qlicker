import { Meteor } from 'meteor/meteor'
import { Settings } from '../imports/api/settings.js'


import Fiber from 'fibers'
import bodyParser from 'body-parser'
import saml from 'passport-saml'
import url from 'url'
import xmldom from 'xmldom'
import xpath from 'xpath'

//console.log(Meteor.absoluteUrl())

settings = Settings.findOne({})


//Only if SSO is enabled, set things up
//These setting take effect only after restarting the app, if the SSO is enabled/disabled
if(settings && settings.SSO_enabled && settings.SSO_emailIdentifier && settings.SSO_entrypoint && settings.SSO_identifierFormat ){

//Create a passport-saml strategy using the given settings
//User is responsible for creating a private key and corresponding certificate and storing them in /private
//note that privateCert is actually a key, the same as decryptionPvk

  strategy = new saml.Strategy({
    callbackUrl: Meteor.absoluteUrl('SSO/SAML2'),
    logoutCallbackUrl: Meteor.absoluteUrl('SSO/SAML2/logout'),
    entryPoint: settings.SSO_entrypoint,
    cert: settings.SSO_cert,
    identifierFormat: settings.SSO_identifierFormat,
    logoutUrl: (settings.SSO_logoutUrl ? settings.SSO_logoutUrl : ''),
    //privateCert: Assets.getText('key.key'),//not needed
    decryptionPvk: settings.SSO_privKey,//Assets.getText('key.key'),//probably needed
    issuer: 'qlicker',
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
    let profile = Accounts.saml._loginResultForCredentialToken[credentialToken];
    delete Accounts.saml._loginResultForCredentialToken[credentialToken];
    return profile;
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
        let services = { sso: {id: samlInfo.nameID,
                               nameIDFormat: samlInfo.nameIDFormat,
                               nameID:samlInfo.nameID,
                               email: samlProfile.email } }

        if(user){//existing user, update their profile
          userId = user._id
          for (key in samlProfile){
            profile[key] = samlProfile[key]
          }
          //Note that it will not actually update the email address, since the user was found by email address
          Meteor.users.update(userId, {$set: {email: profile.email,
                                              emails: [ { address: profile.email, verified: true } ],
                                              profile: profile,
                                              services: services
                                              }
                                      });
        } else {//new user
          profile.roles = ['student']
          userId = Accounts.createUser({
                   email: profile.email,
                   password: Random.secret(),//user will need to reset password to set it to something useful!
                   profile: profile
                 })
          Meteor.users.update(userId, {$set: { emails: [ { address: profile.email, verified: true } ], services: services} })
        }
        //By adding a stamped token, the user gets logged in
        let stampedToken = Accounts._generateStampedLoginToken()
        let hashStampedToken = Accounts._hashStampedToken(stampedToken)
        Meteor.users.update(userId, { $push: { 'services.resume.loginTokens': hashStampedToken},
                                      $set: { 'services.sso.session': {sessionIndex: samlInfo.sessionIndex,
                                                                       loginToken: hashStampedToken.hashedToken }}})
        //user = Meteor.users.findOne(userId)
        //console.log(user)
        return {
          userId: userId,
          token: stampedToken.token
        }
        } else {
          throw new Error("Could not find a profile with the specified credentialToken.");
      }
    }
  })

  //This method provides a link to the SSO logout with the required SAML request.
  //This is the link that goes with the Logout From SSO button in page_container
  //This is based on what was done in https://github.com/lucidprogrammer/meteor-saml-sp/blob/master/src/server/samlServerHandler.js
  Meteor.methods({
   "getSSOLogoutUrl": (callback) => {
      if (settings.SSO_logoutUrl === '') return null
      user = Meteor.user()
      if (!user || !user.services || !user.services.sso || !user.services.sso.session || !user.services.sso.session.sessionIndex) return null
      var getLogoutLinkSync =  Meteor.wrapAsync(getSSLogoutAsync);
      var result = getLogoutLinkSync(user);
      return result;
    },
    "isSSOSession": () =>{
      user = Meteor.user()
      return (user && user.services && user.services.sso && user.services.sso.session && user.services.sso.session.sessionIndex)
    }
  })

  let getSSLogoutAsync = function(user, callback){
      let request  = {user : {nameID : user.services.sso.id , nameIDFormat: user.services.sso.nameIDFormat, sessionIndex: user.services.sso.session.sessionIndex}  };
      let getLogout = Accounts.samlStrategy._saml.getLogoutUrl(request, function(error,url){
         if(error) console.log(error);
         //The IDP POST request results in the logout and erasing the session, so no need to do it here
         //console.log("url");
         //console.log(url);
         /*Fiber(function () {
           Meteor.users.update({_id:userId},{$set : {"services.sso.session": {} } });
         }).run();*/
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
              const decryptionCert = settings.SSO_privCert//Assets.getText('cert.cert');
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
            if (url.parse(req.url).pathname === '/logout') {
              //----------- Hack start
              //A hack to bypass the SSO stuff and log the user out using the SessionIndex in the IDP POST request
              //(needed because passport-saml cannot validate the encrypted response)
              //WARNING: This does not check that the POST came from the IDP
              let xml = new Buffer(req.body.SAMLRequest, 'base64').toString('utf8');
              let dom = new xmldom.DOMParser().parseFromString(xml);
              let sessionIndex = xpath(dom, "/*[local-name()='LogoutRequest']/*[local-name()='SessionIndex']/text()")[0].data;
                //console.log("log out hack")
              let user = Meteor.users.findOne({ 'services.sso.session.sessionIndex':sessionIndex })
                //console.log(user)
              if(user){ //remove the session ID and the login token
                Meteor.users.update({_id:user._id},{ $set: {'services.sso.session': {}, 'services.resume.loginTokens' : [] } })
              }
                //console.log(user)
              res.writeHead(302, {'Location': Meteor.absoluteUrl('login')});//this does not work, probably need a different response
              res.end()
              //----------- Hack end
              //The code below should be used instead of the hack above!!! It should work if we disable encryption
              //on nameID, but we can't figure out how to do this... Passport-saml doesn't know how to validate a POST
              //request if it is encrypter (they have a PR to implement it the same way they validate POST response, as in login)
              /*
              Accounts.samlStrategy._saml.validatePostRequest(req.body, function(err, result){
                if(!err){ //based on https://github.com/lucidprogrammer/meteor-saml-sp/blob/master/src/server/samlServerHandler.js
                  console.log("validating post request")
                  console.log(result)
                  let user = Meteor.users.findOne({ 'services.sso.session.sessionIndex':result['sessionIndex'] })
                  if(user){ //remove the session ID and the login token
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
              }) */ // end of validate post request

            } else {//POST request for login:
              Accounts.samlStrategy._saml.validatePostResponse(req.body, function (err, result) {
                if (!err) {
                  email = result[settings.SSO_emailIdentifier] //settings.SSO_emailIdentifier has to be specified (see if at top)
                  firstname = settings.SSO_firstNameIdentifier ? result[settings.SSO_firstNameIdentifier] : 'Brice'
                  lastname = settings.SSO_lastNameIdentifier ? result[settings.SSO_lastNameIdentifier] : 'de Nice'

                  profile = {email:email, firstname:firstname, lastname:lastname}

                  Accounts.saml.insertCredential(req.body.RelayState, {profile:profile,
                                                                       sessionIndex:result['sessionIndex'],
                                                                       nameID: result.nameID,
                                                                       nameIDFormat: result.nameIDFormat,
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
