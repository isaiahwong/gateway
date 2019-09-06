import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';

import Http from './lib/http';
import discovery from './lib/discovery';

import responseHandler from './middleware/responseHandler';
import notFound from './middleware/notFound';
import errorHandler from './middleware/errorHandler';

class AdminServer extends Http {
  constructor(options = {}) {
    const {
      nodeEnv,
      port,
    } = options;
    super({
      nodeEnv,
      port: port || process.env.ADMIN_PORT || 8080,
      name: 'Admin Server'
    });
    this.attachMiddleware();
  }

  static routes() {
    const router = new express.Router();

    router.get('/service-count', (req, res) => {
      res.ok({ count: discovery.serviceCount });
    });

    router.all('/hz', (req, res) => {
      res.ok();
    });
    return router;
  }

  attachMiddleware() {
    this.app.use(responseHandler);
    this.app.use(bodyParser.json());

    this.app.use(helmet());
    this.app.use(helmet.hidePoweredBy({ setTo: '' }));

    this.app.use('/', AdminServer.routes());

    this.app.use(notFound);
    this.app.use(errorHandler);
  }
}

export default AdminServer;
