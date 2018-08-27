import { Random } from 'meteor/random'

//Create a saml object in acccounts if it does not exist
if (!Accounts.saml) {
  Accounts.saml = {};
}

//Open a popup with the redirect request to the IDP for SSO login
//Popup will be closed when the server receives a valid POST response
//at the /SSO/SAML route (see server/saml_server.js)
Accounts.saml.initiateLogin = function(options, callback, dimensions) {
  // default dimensions that worked well for facebook and google
  var popup = openCenteredPopup(
    Meteor.absoluteUrl('SSO/SAML2?RelayState='+options.credentialToken),
    (dimensions && dimensions.width) || 650,
    (dimensions && dimensions.height) || 500);

  var checkPopupOpen = setInterval(function() {
    try {
      var popupClosed = popup.closed || popup.closed === undefined;
    } catch (e) {
      return;
    }
    if (popupClosed) {
      clearInterval(checkPopupOpen);
      callback(options.credentialToken);
    }
  }, 100);
};


var openCenteredPopup = function(url, width, height) {
  var screenX = typeof window.screenX !== 'undefined'
        ? window.screenX : window.screenLeft;
  var screenY = typeof window.screenY !== 'undefined'
        ? window.screenY : window.screenTop;
  var outerWidth = typeof window.outerWidth !== 'undefined'
        ? window.outerWidth : document.body.clientWidth;
  var outerHeight = typeof window.outerHeight !== 'undefined'
        ? window.outerHeight : (document.body.clientHeight - 22);
  // XXX what is the 22?

  // Use `outerWidth - width` and `outerHeight - height` for help in
  // positioning the popup centered relative to the current window
  var left = screenX + (outerWidth - width) / 2;
  var top = screenY + (outerHeight - height) / 2;
  var features = ('width=' + width + ',height=' + height +
                  ',left=' + left + ',top=' + top + ',scrollbars=yes');

  var newwindow = window.open(url, 'Login', features);
  if (newwindow.focus)
    newwindow.focus();
  return newwindow;
};


//Wrapper for callLoginMethod, which opens the popup and calls the login handler
//with the generated credential token
//The random token is passed as RelayState to the IDP (see initiateLogin above),
//and then back to the server by the IDP. This allows the server to identify
//this client as the one starting the login request
Meteor.loginWithSaml = function(options, callback) {
  options = options || {};
  options.credentialToken = Random.secret(); 
     
  Accounts.saml.initiateLogin(options, function (error, result) {
    Accounts.callLoginMethod({
      methodArguments: [{saml: true, credentialToken: options.credentialToken}],
      userCallback: callback
    });
  });
};




