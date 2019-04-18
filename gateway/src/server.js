import express from 'express';
import http from 'http';
import helmet from 'helmet';
import logger from './libs/logger';
import { setupLanguage } from './libs/i18n';

import attachMiddlewares from './middlewares';

class HttpServer {
  constructor(protos) {
    this.appEnv = __PROD__ ? 'production' : 'development';
    this.protos = protos;
    this.server = http.createServer();
    this.app = express();

    // Setup locales
    setupLanguage();
    this.app.set('port', process.env.PORT || 5000);

    // secure app by setting various HTTP headers.
    this.app.use(helmet());
  }

  async listen() {
    await attachMiddlewares(this.app, this.server, { protos: this.protos });
    
    this.server.on('request', this.app);
    this.server.listen(this.app.get('port'), () => {
      logger.info(`Node Server listening on port ${this.app.get('port')}`);
      logger.verbose(`Running ${this.appEnv}`);
    });
  }
}

export default HttpServer;