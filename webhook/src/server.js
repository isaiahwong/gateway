import fs from 'fs';
import https from 'https';
import express from 'express';
import logger from 'esther';
import bodyParser from 'body-parser';

import attachMiddlewares from './middleware';

class WebhookServer {
  constructor(options = {}) {
    this.appEnv = options.appEnv || 'development';

    const key = fs.readFileSync('/run/secrets/tls/tls.key', 'utf8');
    const cert = fs.readFileSync('/run/secrets/tls/tls.crt', 'utf8');

    this.app = express();

    this.server = https.createServer({ key, cert });
    this.app.set('port', options.port || process.env.PORT || 8443);
  }

  async listen() {
    const router = new express.Router();
    router.use(bodyParser.json());

    attachMiddlewares(this.app);

    this.server.on('request', this.app);
    this.server.listen(this.app.get('port'), () => {
      logger.info(`Webhook Server listening on port ${this.app.get('port')}`);
      logger.info(`Running ${this.appEnv}`);
    });
  }
}

export default WebhookServer;
