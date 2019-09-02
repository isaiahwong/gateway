require('@babel/polyfill');

// Setup Bluebird as the global promise library
global.Promise = require('bluebird');

const logger = require('esther');
const pkg = require('../package.json');
const WebhookServer = require('./server');

// initialise logger
logger.init({
  useFileTransport: false,
  disableStackTrace: true,
  useStackDriver: process.env.ENABLE_STACKDRIVER === 'true',
  stackDriverOpt: {
    serviceName: 'gateway-webhook-service',
    ver: pkg.version
  }
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection at: ${reason} ${reason.stack}`);
  // send entire app down. k8s will restart it
  process.exit(1);
});

const server = new WebhookServer();

server.listen();
