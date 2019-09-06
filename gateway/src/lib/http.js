import fs from 'fs';
import https from 'https';
import http from 'http';
import express from 'express';
import logger from 'esther';
import { capitalize } from 'lodash';

class Http {
  constructor(options = {}) {
    const {
      nodeEnv,
      port,
      tls,
      keyDir,
      certDir,
      name
    } = options;

    let key;
    let cert;

    if (tls) {
      key = fs.readFileSync(keyDir, 'utf8');
      cert = fs.readFileSync(certDir, 'utf8');
      this.server = https.createServer({ key, cert });
    }
    else {
      this.server = http.createServer();
    }

    this.name = name || 'Server';
    this.nodeEnv = nodeEnv || __PROD__ ? 'production' : 'development';

    this.app = express();
    this.app.set('port', port);
  }

  listen() {
    this.server.on('request', this.app);
    this.server.listen(this.app.get('port'), () => {
      logger.info(`[${capitalize(this.nodeEnv)}] ${this.name} listening on port ${this.app.get('port')}`);
    });
  }
}

export default Http;
