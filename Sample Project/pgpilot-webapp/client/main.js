import { Meteor } from 'meteor/meteor' // eslint-disable-line
import React from 'react'
import { render } from 'react-dom';
import PGNodes from './imports/PGNodes.jsx'
import MainNavBar from './imports/NavBar.jsx'

Meteor.startup(() => { // #Cypuu#
  render(<MainNavBar />, document.getElementById('navbar'));
  render(<PGNodes />, document.getElementById('nodes'));
  // We don't use React for the console at the moment, still use Blaze.
  // render(<Console />, document.getElementById("console"));
});
