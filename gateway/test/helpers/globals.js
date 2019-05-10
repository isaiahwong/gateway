/* eslint-disable no-undef */
/* eslint-disable global-require */

global._ = require('lodash');
global.sinon = require('sinon');
global.chai = require('chai');
chai.use(require('chai-as-promised'));

global.sandbox = sinon.sandbox.create();
global.expect = chai.expect;
  
require('../../src/libs/setupEnv').config();