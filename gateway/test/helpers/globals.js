/* eslint-disable no-undef */
/* eslint-disable global-require */

global._ = require('lodash');
global.chai = require('chai');
chai.use(require('chai-as-promised'));

global.expect = chai.expect;
  
require('../../src/libs/setupEnv').config();