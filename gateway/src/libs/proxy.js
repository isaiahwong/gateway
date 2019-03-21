import HttpProxy from 'http-proxy';

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
  
  _onError() {
    this.serverInterface.on('error', (err, req, res) => {
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
    
      res.end('Something went wrong. And we are reporting a custom error message.');
    });
  }

  web(req, res, options) {
    this.serverInterface.web(req, res, options);
  }
}

export default new Proxy();