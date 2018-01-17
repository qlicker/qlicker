# QLICKER
Open Source Clicker - CISC498

[![CircleCI](https://circleci.com/gh/qlicker/qlicker.svg?style=shield&circle-token=add100d7632954b295a5010c4d904e5b7801d8f5)](https://circleci.com/gh/qlicker/qlicker)
[![GitHub issues](https://img.shields.io/github/issues/qlicker/qlicker.svg)](https://github.com/qlicker/qlicker/issues)
[![GNU GPL v3](https://img.shields.io/badge/license-GNU%20GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[![JSDocs](https://img.shields.io/badge/Documentation-JSDocs-green.svg)](https://rawgit.com/qlicker/qlicker/master/docs/.jsdocs/index.html)
[![Documentation](https://img.shields.io/badge/Documentation-User%20Manual-green.svg)](https://github.com/qlicker/qlicker/tree/master/docs)



Qlicker is an application that will make it easier for professors to integrate student participation in classes. This involves a mobile-capable web application that can be used by students on their own devices as an alternative to the very common and hardware based iClicker system.

![overview](docs/images/overview.png)

## Running Qlicker

1. Install meteor
```
curl https://install.meteor.com/ | sh 
```

2. Clone the repo, and create a settings.json file with the proper s3 creditionals in the root directory of the cloned repo. This is an example:
```
{
  "bucket":"bucketimage",
  "AWSRegion":"region",
  "AWSAccessKeyId":"SECRET",
  "AWSSecretAccessKey":"SECRET"
}
```

If you do not include the s3 credentials, the app will still run but image uploading will not work. If you do not have these credentials, you can use an [S3 Emulator](https://github.com/jubos/fake-s3).

3. Install the node packages.
```
meteor npm install
```

Note, if you use `npm install` instead of `meteor npm install`, you will need to manually delete the `node_modules` directory, and then run `meteor npm install`.

4. Run the program.
```
meteor --settings settings.json
```

To run tests locally
`npm run test:unit-watch` or `npm run test:app-watch`

## Development and Contributing

This application is built using the meteor web framework. Meteor is a node.js web framework that allows for tight integrator of server and client side javascript. It integrates with mongodb to provide seamless data model integration using pub-sub to automatically render changes on the client side. React was chosen over blaze and angular as the frontend user interface library. 

When developing, please adhere to meteor and react opinions as well as following the [Javascript Standard Code Style](http://standardjs.com). 

Changes will be merged into master after PR review.

## Deployment

Build and bundle using `meteor build`. Deploy node app and configure mongodb accordingly.






