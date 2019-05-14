import express from 'express';
import http from 'http';
import helmet from 'helmet';
import logger from './libs/logger';
import { setupLanguage } from './libs/i18n';

import attachMiddlewares from './middlewares';

class HttpServer {

  /**
   * @param {Object} options 
   * @param {String} options.port Http Port
   * @param {Number} options.appEnv Sets server environment
   */
  constructor(options = {}) {
    this.appEnv = options.appEnv || __PROD__ ? 'production' : 'development';
    this.server = http.createServer();
    this.app = express();

    // Setup locales
    setupLanguage();
    this.app.set('port', options.port || process.env.PORT || 5000);

    // secure app by setting various HTTP headers.
    this.app.use(helmet());
  }

  set protos(protos) {
    this._protos = protos;
  }

  async listen() {
    await attachMiddlewares(this.app, this.server, { protos: this._protos });
    
    this.server.on('request', this.app);
    this.server.listen(this.app.get('port'), () => {
      logger.info(`Node Server listening on port ${this.app.get('port')}`);
      logger.info(`Running ${this.appEnv}`);
    });
  }
}

export default HttpServer;