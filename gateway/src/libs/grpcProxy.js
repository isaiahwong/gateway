import grpc from 'grpc';
import pathToRegexp from 'path-to-regexp';
import logger from './logger';

import { NotFound } from '../libs/errors';

class GrpcProxy {

  constructor(protos) {
    this.services = {};
    this.clients = {};
    // eslint-disable-next-line no-unused-expressions
    protos && this.loadProtos(protos);
  }

  getHttpEndpoints(name) {
    const { service } = this.services[name]; // gets service definition
    return Object.keys(service)
      .filter(_k => service[_k].httpEndpoints)
      .map(_k => service[_k].httpEndpoints);
  }

  /**
   * Stores in memory
   * @param {} protos 
   */
  loadProtos(protos) {
    if (!protos || !protos.length) {
      logger.warn('No protos supplied');
      return;
    }

    Object.assign(this.services,
      protos.reduce((accumulator, proto) => {
        const _package = Object.keys(proto)[0];
        const services = proto[_package];
        Object.keys(services).map((key) => {
          services[key].originalName = key;
          accumulator[key.toLowerCase()] = services[key];
        });
        return accumulator;
      }, this.services)
    );
  }

  startClient(name, port) {
    const Client = this.services[name];
    if (!Client) {
      logger.warn(`${name} is not found in protos`);
      return null;
    }

    this.clients[name] = new Client(
      `${name}:${port}`,
      grpc.credentials.createInsecure()
    );

    return new Promise((resolve, reject) =>
      this.clients[name].waitForReady(Date.now() + 1000,
        err => err && reject(err) || resolve(this.clients[name]))
    );
  }

  async call(req, res, options) {
    const { 
      name, 
      port, 
      method
    } = options;

    if (!this.clients[name]) {
      logger.warn(`${name} has not started, will attempt to start it.`);
      // Ends function call if service is not found
      const svc = await this.startClient(name, port);
      if (!svc) {
        return;
      }
    }

    const metadata = new grpc.Metadata();
    const client = this.clients[name];
    const { service } = this.services[name]; // gets service definition
    const { originalUrl } = req;

    const key = Object.keys(service).find((_key) => {
      if (!service[_key].httpEndpoints) {
        return false;
      }

      const {
        path,
        //  method 
      } = service[_key].httpEndpoints;

      const regexp = pathToRegexp(path);

      // Find grpc with the mapped path
      return regexp.exec(originalUrl.split(/[?#]/)[0]);
    });

    if (!client[key]) {
      throw new NotFound(`${originalUrl} not found`);
    } 

    Object.keys(req.headers).forEach(h => metadata.set(h, req.headers[h]));

    let payload = !method && {};

    switch (method.toLowerCase()) {
      case 'post': 
        payload = req.body; break;
      case 'get':
        payload = { ...req.params, ...req.query }; 
        break;
      case 'put': case 'patch': case 'delete':
        // TODO
        break;
      default:
        break;
    }

    client[key](payload, (err, response) => {
      res.json(response);
    });
  }
}

export default GrpcProxy;