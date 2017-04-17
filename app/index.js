var React = require('react');
var ReactDOM = require('react-dom');
require('./index.css');
require('react-bootstrap/dist/react-bootstrap.js');
//require('./bootstrap.min.css');
var App = require('./components/App')


ReactDOM.render(
  <App />,
  document.getElementById('app')
);
