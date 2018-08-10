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
      storageType: 'None'
    })
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


////////////////////////////////////////////////////////////////////////////////////
let Fiber = Npm.require('fibers'),
    bodyParser = Npm.require('body-parser'),
    saml = Npm.require('passport-saml');

let url = Npm.require('url'); 
console.log( Meteor.absoluteUrl())
strategy = new saml.Strategy(
  {      
    callbackUrl: Meteor.absoluteUrl()+'SSO/SAML2',
    logoutCallbackUrl: Meteor.absoluteUrl()+'logout',
    //Queen's
    entryPoint: 'https://idptest.queensu.ca/idp/profile/SAML2/Redirect/SSO',//Queen's test  
    logoutUrl: 'https://idptest.queensu.ca/idp/profile/SAML2/Redirect/SLO',
    //Queen's test -make string using https://www.samltool.com/format_x509cert.php
    cert: 
'MIIDNDCCAhygAwIBAgIVAPoxlYTg8qxF6CeBTgZilfaJvh79MA0GCSqGSIb3DQEBBQUAMB0xGzAZBgNVBAMTEmlkcHRlc3QucXVlZW5zdS5jYTAeFw0xMjA1MTYxODU4NDdaFw0zMjA1MTYxODU4NDdaMB0xGzAZBgNVBAMTEmlkcHRlc3QucXVlZW5zdS5jYTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMQc8MGMMMMt9eG1IAKNdcAKVdvupLzXWHrt3QSrwZeRjk9aio7LjYqVoIRvvvTw1fCdLfNO1C06WXVo2IOaFNj8qN/EfvNXwvA3ocGe8wxErYz4srFnADaLTGv6TGOtTxSm8GrB8IqZWY270Z/IpHC6h/xMUVQ1OqSW9F1WlS0+WtJq+/UQhNSDi2fjTozCaG+xAXuoE3HIrgj+Q33t8XOuaqrI1g5To5BBjXNenOHUuMByQmvROT6k8lYdgxTt0d9SpzRpup/S75aNMvH5b2kE4LGY9S3/awJuV6aaS3BkM+1fv9odCtJHVu4u/8IbI1x/JbihbQQwLtWaCd41ffcCAwEAAaNrMGkwSAYDVR0RBEEwP4ISaWRwdGVzdC5xdWVlbnN1LmNhhilodHRwczovL2lkcHRlc3QucXVlZW5zdS5jYS9pZHAvc2hpYmJvbGV0aDAdBgNVHQ4EFgQU2yTBf8d6BFjqc3XXAwNgIcU2my8wDQYJKoZIhvcNAQEFBQADggEBAEAEh1C1q09IfeXsg7BQeJyExCDpyQPXdLdbTc+/1CDcI9733nkE/Qi41ov/W83ntTeUtZ2y13BwXr+qqoSJD1fSYxWwwibg1v2pztor5aWukeLw+CxVhoOSyc6GkCcjCsT96fnbyKoOtfjEjqvJTaBO5vDbsnMURk8tWHk49+wpwttAglDnZglxpcNcvRGibzBbO6pu0aEvVulQEAc85w+FSF1NvtvlrGnKRcQAw7E8m2538RMiRj9M852LDDcPTfeSgacL/C6PMc1g5nPwo7WRgG7kXj4SQZOWnbTrxrkruEYfT/yG1r9tivRnxF0kwmgbh3Obrq81x+qK8OD+2cQ=',  
    /*
    //Testshib
    entryPoint: 'https://idp.testshib.org/idp/profile/SAML2/Redirect/SSO',
    //testhib cert,-make string using https://www.samltool.com/format_x509cert.php
    cert:
'MIIDAzCCAeugAwIBAgIVAPX0G6LuoXnKS0Muei006mVSBXbvMA0GCSqGSIb3DQEBCwUAMBsxGTAXBgNVBAMMEGlkcC50ZXN0c2hpYi5vcmcwHhcNMTYwODIzMjEyMDU0WhcNMzYwODIzMjEyMDU0WjAbMRkwFwYDVQQDDBBpZHAudGVzdHNoaWIub3JnMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg9C4J2DiRTEhJAWzPt1S3ryhm3M2P3hPpwJwvt2q948vdTUxhhvNMuc3M3S4WNh6JYBs53R+YmjqJAII4ShMGNEmlGnSVfHorex7IxikpuDPKV3SNf28mCAZbQrX+hWA+ann/uifVzqXktOjs6DdzdBnxoVhniXgC8WCJwKcx6JO/hHsH1rG/0DSDeZFpTTcZHj4S9MlLNUtt5JxRzV/MmmB3ObaX0CMqsSWUOQeE4nylSlp5RWHCnx70cs9kwz5WrflnbnzCeHU2sdbNotBEeTHot6a2cj/pXlRJIgPsrL/4VSicPZcGYMJMPoLTJ8mdy6mpR6nbCmP7dVbCIm/DQIDAQABoz4wPDAdBgNVHQ4EFgQUUfaDa2mPi24x09yWp1OFXmZ2GPswGwYDVR0RBBQwEoIQaWRwLnRlc3RzaGliLm9yZzANBgkqhkiG9w0BAQsFAAOCAQEASKKgqTxhqBzROZ1eVy++si+eTTUQZU4+8UywSKLia2RattaAPMAcXUjO+3cYOQXLVASdlJtt+8QPdRkfp8SiJemHPXC8BES83pogJPYEGJsKo19l4XFJHPnPy+Dsn3mlJyOfAa8RyWBS80u5lrvAcr2TJXt9fXgkYs7BOCigxtZoR8flceGRlAZ4p5FPPxQR6NDYb645jtOTMVr3zgfjP6Wh2dt+2p04LG7ENJn8/gEwtXVuXCsPoSCDx9Y0QmyXTJNdV1aB0AhORkWPlFYwp+zOyOIR+3m1+pqWFpn0eT/HrxpdKa74FA3R2kq4R7dXe4G0kUgXTdqXMLRKhDgdmA==', */
      
    privateCert: Assets.getText('key.key'),
    decryptionPvk: Assets.getText('key.key'),
    identifierFormat:'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',

    issuer: 'passport-saml'
  },
  function(profile, done) {
    return done(null, profile);
  })

// Account stuf --------------------
//
//

if (!Accounts.saml) {
  Accounts.saml = {};
}

Accounts.saml._loginResultForCredentialToken = {};

// Inserted during IdP -> SP Callback
Accounts.saml.insertCredential = function (credentialToken, profile) {
  Accounts.saml._loginResultForCredentialToken[credentialToken] = {profile: profile};
};

// Retrieved in account login handler
Accounts.saml.retrieveCredential = function(credentialToken) {
  let profile = Accounts.saml._loginResultForCredentialToken[credentialToken];
  delete Accounts.saml._loginResultForCredentialToken[credentialToken];
  return profile;
};

Accounts.registerLoginHandler(function (loginRequest) {
  if (loginRequest.credentialToken && loginRequest.saml) {
    samlResponse = Accounts.saml.retrieveCredential(loginRequest.credentialToken);     
    if (samlResponse) {
      let samlProfile = samlResponse.profile
      let userId = null
      //let user = Meteor.users.findOne({ "emails.address" : samlProfile.email })
      let user = Accounts.findUserByEmail(samlProfile.email)
      let profile = (user && user.profile) ? user.profile : samlProfile
    
      if(user){//existing user, update their profile
        userId = user._id
        for (key in samlProfile){
          profile[key] = samlProfile[key]   
        }  
        Meteor.users.update(userId, {$set: {email:profile.email, profile: profile}}); 
      } else {//new user
        profile.roles = ['student']
        userId = Accounts.createUser({
                 email: profile.email, 
                 password: Random.secret(),//user will need to reset password to set it to something useful!
                 profile: profile
               })
        Meteor.users.update(userId, { $set: { 'emails.0.verified': true } })
      }
      let stampedToken = Accounts._generateStampedLoginToken()
      let hashStampedToken = Accounts._hashStampedToken(stampedToken)
      Meteor.users.update(userId,{ $push: { 'services.resume.loginTokens': hashStampedToken}})
     
      user = Meteor.users.findOne(userId)
      console.log(user)
      return {
        userId: userId,
        token: stampedToken.token
      }  
 
    } else {
      throw new Error("Could not find a profile with the specified credentialToken.");
    }
  }
});

//End of account stuff

WebApp.connectHandlers
    .use(bodyParser.urlencoded({ extended: false }))
    .use('/SSO/SAML2', function(req, res, next) {
      Fiber(function() {
      try {     
        if (req.method === 'GET') {
          // send the metadata
          if (url.parse(req.url).pathname === '/metadata' || url.parse(req.url).pathname === '/metadata.xml') {
            res.writeHead(200, {'Content-Type': 'application/xml'});
            const decryptionCert = Assets.getText('cert.cert');
            res.end(strategy._saml.generateServiceProviderMetadata(decryptionCert), 'utf-8');
          } else {
            // redirect to IdP (SP -> IdP)
            strategy._saml.getAuthorizeUrl(req, function (err, result) {
              res.writeHead(302, {'Location': result});
              res.end();
            });
          }
        }
        // callback from IdP (IdP -> SP)
        else if (req.method === 'POST') {
          strategy._saml.validatePostResponse(req.body, function (err, result) {
            if (!err) { 
           
              //console.log(result)
              //test shib: 
              /*
              email = result['urn:oid:1.3.6.1.4.1.5923.1.1.1.6']
              name = result['urn:oid:2.5.4.42']
              profile = {email:email, firstname:name, lastname:"Doe"}  
              */
              //Queen's:
              
              email = result['urn:queensu:dir:shib-attr:netidAtQueens']
              firstname = result['urn:oid:2.5.4.42'] 
              lastname = result['urn:oid:2.5.4.4']
              profile ={email:email,firstname:firstname,lastname:lastname}
                
                
              console.log(req.body.RelayState)
              Accounts.saml.insertCredential(req.body.RelayState, profile);
              res.writeHead(200, {'Content-Type': 'text/html'});
              res.end("<html><head><script>window.close()</script></head></html>'", 'utf-8');  

            }
            else {
                console.log(err)
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end("An error occured in the SAML Middleware process.", 'utf-8');
            }
          });
        }
        // Ignore requests that aren't for SAML.
        else {
          next();
          return;
        }
      } catch (err) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            var content = err ?  "An error occured in the SAML Middleware process." : "<html>done</html>'";
            res.end(content, 'utf-8');
      }
    }).run();
});




})
