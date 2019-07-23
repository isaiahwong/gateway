import grpc from 'grpc';
import pathToRegexp from 'path-to-regexp';
import logger from 'esther';
import { NotFound } from 'horeb';
import { decodeMetadata } from 'grpc-utils';

class GrpcProxy {
  constructor(protos) {
    this.services = {};
    this.clients = {};
    // eslint-disable-next-line no-unused-expressions
    protos && this.loadProtos(protos);
  }

  getService(serviceName) {
    // removes special characters such as hypens. i.e payment-service -> paymentservice
    const svc = this.services[serviceName] || this.services[serviceName.replace(/[^\w\s]/gi, '')];
    return svc;
  }

  getClient(serviceName) {
    // removes special characters such as hypens. i.e payment-service -> paymentservice
    const svc = this.clients[serviceName] || this.clients[serviceName.replace(/[^\w\s]/gi, '')];
    return svc;
  }

  getHttpOptions(serviceName) {
    const { service } = this.getService(serviceName); // gets service definition
    return Object.keys(service)
      .filter(_k => service[_k].httpEndpoints)
      .map(_k => service[_k].httpEndpoints);
  }

  /**
   * Stores protos in memory
   * @param {Array} protos
   */
  loadServices(protos) {
    if (!protos || !protos.length) {
      logger.warn('No protos supplied');
      return;
    }

    Object.assign(
      this.services,
      protos.reduce((accumulator, proto) => {
        const _package = Object.keys(proto)[0];
        if (!_package) {
          return accumulator;
        }
        const services = proto[_package];
        if (!services) {
          return accumulator;
        }
        Object.keys(services).forEach((key) => {
          services[key].originalName = key;
          // eslint-disable-next-line no-param-reassign
          accumulator[key.toLowerCase()] = services[key];
        });
        return accumulator;
      }, this.services),
    );
  }

  startClient(serviceName, port) {
    return new Promise((resolve, reject) => {
      const Client = this.getService(serviceName);
      if (!Client) {
        logger.warn(`${serviceName} is not found in services`);
        return resolve(null);
      }

      this.clients[serviceName] = new Client(
        `${serviceName}:${port}`,
        grpc.credentials.createInsecure()
      );

      return this.clients[serviceName]
        .waitForReady(
          Date.now() + 5000,
          // eslint-disable-next-line no-mixed-operators
          err => err && reject(err) || resolve(this.clients[serviceName])
        );
    });
  }

  /**
   * Proxy a grpc service
   * @param req express `req`
   * @param res express `res`
   * @param {Object} options
   * @param {String} options.serviceName Service `serviceName`
   * @param {Number} options.port Service `port`
   * @param {String} options.method i.e http verbs such as `post`, `get`, etc
   * @param {String} options.body body mapping field. `*` will be encapsulated with a `body` key
   */
  async call(req, res, next, options) {
    const {
      serviceName,
      port,
      method,
      body
    } = options;

    if (!this.clients[serviceName]) {
      logger.warn(`${serviceName} has not started, will attempt to start it.`);
      // Ends function call if service is not found

      const svc = await this.startClient(serviceName, port);
      if (!svc) {
        return;
      }
    }

    const metadata = new grpc.Metadata();
    const client = this.getClient(serviceName);
    const { service } = this.getService(serviceName); // gets service definition
    const { originalUrl } = req;

    const rpcCall = Object.keys(service).find((_key) => {
      if (!service[_key].httpEndpoints) {
        return false;
      }

      const {
        path,
        // method
      } = service[_key].httpEndpoints;

      const regexp = pathToRegexp(path);
      // Find grpc with the mapped path
      return regexp.exec(originalUrl.split(/[?#]/)[0]);
    });

    if (!client[rpcCall]) {
      throw new NotFound(`${originalUrl} not found or mapped to rpc method`);
    }
    const headers = { ...req.headers, method: req.method };
    metadata.set('headers-bin', Buffer.from(JSON.stringify(headers)));

    let payload = !method && {};

    switch (method.toLowerCase()) {
      case 'post':
        payload = req.buf || req.body;
        break;
      case 'get':
        payload = { ...req.params, ...req.query };
        break;
      case 'put': case 'patch': case 'delete':
        // TODO
        break;
      default:
        break;
    }

    // if asterisk selector is being used, encapsulate it with a body field
    // as grpc proto requires a defined key
    if (body === '*') {
      payload = { body: payload };
    }

    if (!Buffer.isBuffer(payload) && !Buffer.isBuffer(payload.body)) {
      // encode bytes message field
      Object.keys(payload).forEach((key) => {
        const field = client[rpcCall].resolvedRequestType.fields[key];
        if (field && field.type === 'bytes') {
          payload[key] = Buffer.from(JSON.stringify(payload[key]));
        }
      });
    }

    client[rpcCall](payload, metadata, (err, response) => {
      if (err) {
        if (err.metadata) {
          const errors = decodeMetadata('errors', err.metadata);
          // eslint-disable-next-line no-param-reassign
          err.errors = errors;
        }
        return next(err);
      }
      return res.json(response);
    });
  }
}

export default GrpcProxy;
