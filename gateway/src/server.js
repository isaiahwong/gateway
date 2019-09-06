import helmet from 'helmet';
import compression from 'compression';

import Http from './lib/http';
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

class HttpServer extends Http {
  /**
   * @param {Object} options
   * @param {String} options.port Http Port
   * @param {Number} options.nodeEnv Sets server environment
   */
  constructor(options = {}) {
    const { nodeEnv, port } = options;
    super({
      nodeEnv,
      port: port || process.env.PORT || 5000,
      name: 'Gateway Server'
    });

    // Setup locales
    setupLanguage();
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
    super.listen();
  }
}

export default HttpServer;
