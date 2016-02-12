'use strict';

let webServer = require('./web-server');
let packageListener = require('./package-listener');
// let packageBuilder = require('./package-builder');

webServer();
packageListener();
// packageBuilder();
