// Setup Bluebird as the global promise library
global.Promise = require('bluebird');

// load env variables
require('./libs/setupEnv').config();

const path = require('path');
const logger = require('esther');
const pkg = require('../package.json');
const HttpServer = require('./server');
const grpcLoader = require('./libs/grpcLoader');

// initialise logger
logger.init({
  useFileTransport: true,
  logDirectory: path.join(__dirname, '..', 'logs'),
  useStackDriver: process.env.ENABLE_STACKDRIVER === 'true',
  stackDriverOpt: {
    serviceName: 'gateway-service',
    ver: pkg.version
  }
});

process.on('unhandledRejection', (reason, p) => {
  logger.error(`Unhandled Rejection at: ${p} \nreason: ${reason.stack || reason}`);
  // send entire app down. k8s will restart it
  process.exit(1);
});

const PROTO_PATH = __PROD__ ? path.join(__dirname, 'proto/') : path.join(__dirname, '..', '/proto/');

// Load protos to be injected to HTTP server and Grpc Server
const protos = [];
grpcLoader.loadProtos(protos, PROTO_PATH);

const server = new HttpServer();
server.protos = protos;

server.listen();
