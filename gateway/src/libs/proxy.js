import HttpProxy from 'http-proxy';

import { NotFound } from './errors';
import errorHandler from '../middlewares/errorHandler';

class Proxy {
  constructor() {
    this.serverInterface = HttpProxy.createProxyServer({
      preserveHeaderKeyCase: true,
      ws: true
    });

    this._onError();
  }

  _getEventNames() {
    return this.serverInterface.eventNames();
  }
  
  /**
   * Handles Not found route with errorHandler middleware
   */
  _onError() {
    this.serverInterface.on('error', (err, req, res, next) => {
      if (err.code === 'ENOTFOUND') {
        err = new NotFound();
      }
      errorHandler(err, req, res, next);
    });
  }

  web(req, res, options) {
    this.serverInterface.web(req, res, options);
  }
}

export default new Proxy();