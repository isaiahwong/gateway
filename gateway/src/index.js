require('@babel/polyfill');

// Setup Bluebird as the global promise library
global.Promise = require('bluebird');

// load env variables
require('./libs/setupEnv').config();

const path = require('path');
const HttpServer = require('./server').default;
const GrpcLoader = require('./libs/grpcLoader').default;
const logger = require('./libs/logger').default;

process.on('unhandledRejection', (reason, p) => {
  logger.error(`Unhandled Rejection at: ${p} \nreason: ${reason}`);
  // send entire app down. k8s will restart it
  process.exit(1);
});

const PROTO_PATH = path.join(__dirname, '..', '/proto/');

const grpcLoader = new GrpcLoader();

// Load protos to be injected to HTTP server and Grpc Server
const protos = [];
grpcLoader.loadProtos(protos, PROTO_PATH);

const server = new HttpServer(protos);

server.listen();