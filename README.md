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

## Using Qlicker

[Visit User Guide](https://qlicker.github.io)

## Running Qlicker

1. Install meteor
```
curl https://install.meteor.com/ | sh 
```

2. Clone the repo, and install the node packages.
```
meteor npm install
```

Note, if you use `npm install` instead of `meteor npm install`, you will need to manually delete the `node_modules` directory, and then run `meteor npm install`.

3. Run the program.
```
meteor
```

To run tests locally
`npm run test:unit-watch` or `npm run test:app-watch`

## Development and Contributing

This application is built using the meteor web framework. Meteor is a node.js web framework that allows for tight integrator of server and client side javascript. It integrates with mongodb to provide seamless data model integration using pub-sub to automatically render changes on the client side. React was chosen over blaze and angular as the frontend user interface library. 

When developing, please adhere to meteor and react opinions as well as following the [Javascript Standard Code Style](http://standardjs.com). 

Changes will be merged into master after PR review.

## Deployment

Build and bundle using `meteor build`. Deploy node app and configure mongodb accordingly.

### Docker deployment
We provide a docker image of qlicker that is built using node:alpine as a base image. This docker image does not have mongo built in it. Access it at:
```
docker pull qlicker/qlicker:v1.2.2
```
To run the image, you must specify at least ROOT_URL and MONGO_URL environment variables (credentials here are presented using host environment variables):
```
docker run -d \
-e ROOT_URL=http://localhost:3000 \
-e MONGO_URL=mongodb://${DBADMINUSER}:${DBADMINPWD}@db:27017/${DBNAME}?replicaSet=${REPLICASETNAME} \
-e MONGO_OPLOG_URL=mongodb://${DBOLUSER}:${DBOLPWD}@db:27017/local?authSource=admin \
-e MAIL_URL=${MAIL_URL}\
-p 3000:3000 qlicker/qlicker:v1.2.2
```
You do not need to use a replicaset, or specifiy an oplog. The MAIL_URL is required if you want the app to be able to send emails (verify accounts in non-SSO setting, forgot password, etc.). 

In production, you should of course place a proxy in front of the app container to enforce SSL. 

You can build your own docker image as follows:

Clone the repository:
```
git clone https://github.com/qlicker/qlicker.git
```

Switch to a tagged version of the app
```
cd qlicker
git checkout v1.2.2
```

Build a bundle (in this case, it gets placed up a directory into the images/build directory):

```
meteor build ../image/build --server-only --architecture os.linux.x86_64
```

Create a Dockerfile in the directory ../images (if following above build command), so that the application tar file is located in build/
```
FROM node:8.11.4-alpine
#Based on
#https://medium.com/@gary.ascuy/dockerize-deploy-meteor-app-using-docker-with-5-mo-the-force-awakens-d9c72d111198

ENV BUILD_PACKAGES="python make gcc g++ git libuv bash curl tar bzip2" \
    NODE_ENV=production \
    ROOT_URL=http://localhost:3000 \
    PORT=3000

WORKDIR /root/app/bundle

ADD ./build/app.tar.gz /root/app
RUN apk --update add ${BUILD_PACKAGES} \
    && (cd programs/server/ && npm install --unsafe-perm) \
    && apk --update del ${BUILD_PACKAGES}
    
RUN apk update && apk upgrade
EXPOSE 3000
CMD node main.js
```

Build the image:
```
docker build -t yourname/qlicker:v1.2.3 .
```

Run it as above
```
docker run -d \
-e ROOT_URL=http://localhost:3000 \
-e MONGO_URL=mongodb://${DBADMINUSER}:${DBADMINPWD}@db:27017/${DBNAME}?replicaSet=${REPLICASETNAME} \
-e MONGO_OPLOG_URL=mongodb://${DBOLUSER}:${DBOLPWD}@db:27017/local?authSource=admin \
-e MAIL_URL=${MAIL_URL}\
-p 3000:3000 yourname/qlicker:v1.2.3
```




