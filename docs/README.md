# QLICKER

Documentation and User Manual

## JSDocs
All meteor methods and React components are documented using JSDoc.
You can view the HTML version hosted at: 
[https://rawgit.com/etenoch/qlicker/etenoch/master/docs/jsdocs/index.html](https://rawgit.com/etenoch/qlicker/etenoch/master/docs/jsdocs/index.html)

### To update the JSDocs
```
npm install jsdoc -g # install jsdoc
jsdoc imports/* docs/README.md -d docs/jsdocs # generate jsdoc and put in this folder
```

## Other Documentation
All other documentation including user manuals are in the markdown files below.
### Qlicker User Manual
* [Student User Manual](/etenoch/qlicker/blob/master/docs/UserManual-Student.md)
* [Professor User Manual](/etenoch/qlicker/blob/master/docs/UserManual-Professor.md)
* [Admin User Manual](/etenoch/qlicker/blob/master/docs/UserManual-Admin.md)

### Developing Qlicker
* [Architecture Overview](/etenoch/qlicker/blob/master/docs/Development-Architecture-Overview.md)
* [Database and Data Structure](/etenoch/qlicker/blob/master/docs/Development-Data.md)
* [Development Guide](/etenoch/qlicker/blob/master/docs/Development-Guide.md)
* [Meteor Method API List](/etenoch/qlicker/blob/master/docs/Development-Meteor-Methods.md)

### Deploying Qlicker
* [Deploying Manually](/etenoch/qlicker/blob/master/docs/Deploying.md)
* [Docker Deployment](/etenoch/qlicker/blob/master/docs/Docker.md)