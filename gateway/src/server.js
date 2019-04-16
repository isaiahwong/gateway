/* eslint import/first: 0 */
import express from 'express';
import http from 'http';
import helmet from 'helmet';
import path from 'path';

import GrpcLoader from './libs/grpcLoader';
import logger from './libs/logger';
import { setupLanguage } from './libs/i18n';

const PROTO_PATH = path.join(__dirname, '..', 'proto/');
const INCLUDE_PATH = './proto/'; // Relative Path only

const server = http.createServer();
const app = express();

const grpcLoader = new GrpcLoader();

// Load protos to be injected to HTTP server and Grpc Server
const protos = grpcLoader.loadProtos(PROTO_PATH, [INCLUDE_PATH]);

app.set('port', process.env.PORT || 5000);

// secure app by setting various HTTP headers.
app.use(helmet());

// Setup locales
setupLanguage();

const appEnv = __PROD__ ? 'production' : 'development';

import attachMiddlewares from './middlewares';

attachMiddlewares(app, server, { protos })
  .then(() => {
    server.on('request', app);
    server.listen(app.get('port'), () => {
      logger.info(`Node Server listening on port ${app.get('port')}`);
      logger.verbose(`Running ${appEnv}`);
    });
  });

export default server;