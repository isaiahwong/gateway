require('@babel/polyfill');
// Setup Bluebird as the global promise library
global.Promise = require('bluebird');

// Initialize configuration
require('./libs/setupEnv').config();

module.exports = require('./server');