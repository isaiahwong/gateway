require('../../src/libs/setupEnv').config();

process.env.NODE_ENV = 'test';

require('../../src/server');