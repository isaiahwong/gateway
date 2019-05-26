import HttpProxy from 'http-proxy';

import { NotFound } from './errors';
import errorHandler from '../middlewares/errorHandler';

class Proxy {
  constructor() {
    this.proxyInterface = HttpProxy.createProxyServer({
      preserveHeaderKeyCase: true,
      ws: true
    });

    this._onError();
  }

  _getEventNames() {
    return this.proxyInterface.eventNames();
  }

  /**
   * Handles Not found route with errorHandler middleware
   */
  _onError() {
    this.proxyInterface.on('error', (err, req, res, next) => {
      if (err.code === 'ENOTFOUND') {
        // eslint-disable-next-line no-param-reassign
        err = new NotFound();
      }
      errorHandler(err, req, res, next);
    });
  }

  web(req, res, options) {
    this.proxyInterface.web(req, res, options);
  }
}

export default new Proxy();
