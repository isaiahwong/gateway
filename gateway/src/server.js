import express from 'express';
import http from 'http';
import helmet from 'helmet';
import logger from 'esther';
import compression from 'compression';

import { setupLanguage } from './lib/i18n';

// Middleware
import morgan from './middleware/morgan';
import cors from './middleware/cors';
import notFound from './middleware/notFound';
import language from './middleware/language';
import responseHandler from './middleware/responseHandler';
import errorHandler from './middleware/errorHandler';
import discovery from './middleware/discovery';
import topLevelRoutes from './middleware/topLevelRoutes';

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

  async attachMiddleware(args) {
    // trust proxy requests behind nginx.
    this.app.set('trust proxy', true);

    // attach res.respond and res.t
    this.app.use(responseHandler);
    this.app.use(language);

    this.app.use(compression());

    // logs every request
    this.app.use(morgan);

    // Set CORS
    cors(this.app);

    this.app.use(helmet());
    this.app.use(helmet.hidePoweredBy({ setTo: '' }));

    // proxy api routes
    await discovery(this.app, args.protos);

    this.app.use('/', topLevelRoutes);

    this.app.use(notFound);
    this.app.use(errorHandler);
  }

  async listen() {
    await this.attachMiddleware({ server: this.server, protos: this._protos });

    this.server.on('request', this.app);
    this.server.listen(this.app.get('port'), () => {
      logger.info(`Node Server listening on port ${this.app.get('port')}`);
      logger.info(`Running ${this.appEnv}`);
    });
  }
}

export default HttpServer;
