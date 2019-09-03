import fs from 'fs';
import https from 'https';
import express from 'express';
import logger from 'esther';
import bodyParser from 'body-parser';

import responseHandler from './middleware/responseHandler';
import notFound from './middleware/notFound';
import errorHandler from './middleware/errorHandler';

import discovery from './lib/discovery';

class WebhookServer {
  constructor(options = {}) {
    const {
      nodeEnv,
      port,
      disableClient = process.env.DISABLE_K8S_CLIENT === 'true'
    } = options;
    this.disableClient = disableClient;

    if (this.disableClient) return;

    this.nodeEnv = nodeEnv || 'development';
    this.app = express();

    const key = fs.readFileSync('/run/secrets/tls/tls.key', 'utf8');
    const cert = fs.readFileSync('/run/secrets/tls/tls.crt', 'utf8');

    this.server = https.createServer({ key, cert });
    this.app.set('port', port || process.env.WEBHOOK_PORT || 8443);
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

  listen() {
    if (this.disableClient) return;
    const router = new express.Router();
    router.use(bodyParser.json());

    this.attachMiddleware();

    this.server.on('request', this.app);
    this.server.listen(this.app.get('port'), () => {
      logger.info(`Webhook Server listening on port ${this.app.get('port')}`);
      logger.info(`Running ${this.nodeEnv}`);
    });
  }
}

export default WebhookServer;
