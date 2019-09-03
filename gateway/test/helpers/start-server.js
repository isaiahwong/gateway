require('../../src/lib/setupEnv').config();

process.env.NODE_ENV = 'test';

require('../../src/server');