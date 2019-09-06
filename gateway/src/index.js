require('@babel/polyfill');

// Setup Bluebird as the global promise library
global.Promise = require('bluebird');

// load env variables
require('./lib/setupEnv').config();

const path = require('path');
const logger = require('esther');
const pkg = require('../package.json');
const HttpServer = require('./server');
const AdminServer = require('./admin');
const WebhookServer = require('./webhook');
const grpcLoader = require('./lib/grpcLoader');

// initialise logger
logger.init({
  useFileTransport: true,
  logDirectory: path.join(__dirname, '..', 'logs'),
  disableStackTrace: true,
  useStackDriver: process.env.ENABLE_STACKDRIVER === 'true',
  stackDriverOpt: {
    serviceName: 'gateway-service',
    ver: pkg.version
  }
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection at: ${reason} ${reason.stack}`);
  // send entire app down. k8s will restart it
  process.exit(1);
});

const PROTO_PATH = __PROD__ ? path.join(__dirname, 'proto/') : path.join(__dirname, '..', '/proto/');

// Load protos to be injected to HTTP server and Grpc Server
const protos = [];
grpcLoader.loadProtos(protos, PROTO_PATH);

const webhook = new WebhookServer();
const server = new HttpServer();
const admin = new AdminServer();
server.protos = protos;

server.listen();
webhook.listen();
admin.listen();
