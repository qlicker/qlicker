# Development Guide

Qlicker is a Meteor application using React as the frontend templating framework. The `react-meteor-data` package is used to provide reactive data to the React components. All interaction is sent to the server via Meteor methods. Meteor methods are documented with JSDoc and are defined in js files in `/imports/api`. 

In general reusable components are named using Pascal Case. These live as direct childs of the `/imports/ui` directory. They are all documented by JSDocs. Other `.jsx` files (files in `imports/ui/pages`) are meant to represent 'pages' of the web application. These components are often mounted by Iron Router.



