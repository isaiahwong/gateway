import express from 'express';
import logger from 'esther';
import bodyParser from 'body-parser';

import responseHandler from './middleware/responseHandler';
import notFound from './middleware/notFound';
import errorHandler from './middleware/errorHandler';

import Http from './lib/http';
import discovery from './lib/discovery';

class WebhookServer extends Http {
  constructor(options = {}) {
    const {
      nodeEnv,
      port,
      disableClient = process.env.DISABLE_K8S_CLIENT === 'true'
    } = options;
    super({
      nodeEnv,
      port: port || process.env.WEBHOOK_PORT || 8443,
      tls: true,
      keyDir: '/run/secrets/tls/tls.key',
      certDir: '/run/secrets/tls/tls.crt',
      name: 'Webhook Server'
    });
    this.disableClient = disableClient;

    this.attachMiddleware();

    Object.getOwnPropertyNames((Object.getPrototypeOf(this)))
      .forEach((prop) => {
        if (prop === 'constructor') {
          return;
        }
        if (typeof this[prop] === 'function') {
          const initialFn = this[prop].bind(this);
          this[prop] = (...args) => {
            if (this.disableClient) {
              logger.warn('K8S is disabled');
              return null;
            }
            return initialFn(...args);
          };
        }
      });
  }

  static routes() {
    const router = new express.Router();

    router.post('/webhook', async (req, res) => {
      // only accept user-agent kube-apiserver-admission
      if (!req.headers
        || !req.headers['user-agent']
        || req.headers['user-agent'] !== 'kube-apiserver-admission') {
        return res.ok();
      }
      discovery.discover(req.body);
      return res.ok();
    });

    router.all('/hz', (req, res) => {
      res.ok();
    });
    return router;
  }

  attachMiddleware() {
    this.app.use(responseHandler);
    this.app.use(bodyParser.json());

    this.app.use('/', WebhookServer.routes());

    this.app.use(notFound);
    this.app.use(errorHandler);
  }
}

export default WebhookServer;
