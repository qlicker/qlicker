# Application Architecture Overview

Qlicker is a Meteor application using React as the frontend templating framework.

```
QLICKER
├── app-test (scripts for meteor full app testing, out of date)
├── client (client side css, js, html)
│   ├── css (scss files, imports, mixins, etc.)
│   ├── fonts (bootstrap icon font)
│   ├── main.html (primary web page starting point)
│   └── main.js (inital client side JS)
├── docs
├── imports
│   ├── api
│   │   ├── [collection].js (various files for each mongo collection, see docs/Development-Data.md)
│   │   ├── [collection].test.js (a corresponding tests file for each set of collection methods)
│   ├── startup
│   │   ├── index.js (file file imported on client side)
│   │   ├── routes.jsx (Iron router routes for whole app)
│   ├── ui (all the JSX react components)
│   │   ├── layouts/app_layout.jsx
│   │   ├── modals 
│   │   ├── pages (React components that serve as top level 'pages')
│   │   ├── pages/page_container.jsx (page wrapper with navbar)
│   │   ├── [various react components].jsx (refer to JSDocs)
│   ├── utils
│   ├── config.js (a bunch of constants)
│   ├── wysiwyg-helpers.jsx (helper methods for CKEditor content)
├── public (static files)
├── server (server only Meteor app code)
└── README.md
```

