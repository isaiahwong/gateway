/* eslint-disable no-mixed-operators */
import express from 'express';

import logger from '../libs/logger';
import k8sClient from '../libs/k8sClient';
import Proxy from '../libs/proxy';
import GrpcProxy from '../libs/grpcProxy';
import { InternalServerError } from '../libs/errors';

import bodyParser from './bodyParser';
import auth from './auth';

const grpcProxy = new GrpcProxy();
let router = new express.Router();
/** Service Counter to keep track of existing services. */
let servicesCount = 0;

async function _proxyHttp(name, port, servicePath) {
  router.use(servicePath, [auth], async (req, res) => {
    /** Proxies request to matched service */
    Proxy.web(req, res, {
      target: `http://${name}:${port}${servicePath}`
    });
  });
}

async function _proxyGrpc(name, port) {
  const svc = await grpcProxy.startClient(name, port);
  if (!svc) return;
  const httpEndpoints = grpcProxy.getHttpEndpoints(name);

  // Create router mappings for GRPC methods with http endpoints
  httpEndpoints.forEach(({ path: httpPath, method }) => {
    if (!httpPath || !method) {
      logger.warn(`${!httpPath && 'Http path and ' || ''} ${!method && 'method' || ''} is not defined.`);
      return;
    }

    router[method](httpPath, [bodyParser, auth], async (req, res, next) => {
      try {
        await grpcProxy.call(req, res, { name, port, method });
        return;
      }
      catch (err) {
        logger.error(err);
        next(err);
      }
    });
  });
}

/**
 * Retrieves routes from k8s services and maps the paths for proxying
 * @metadata `labels` `namespace` `name`
 * @spec `ports`
 */
async function discoverRoutes() {
  const services = await k8sClient.getServices('default');

  // Reinstantiates and resets the routing paths when there's new services
  if (servicesCount === 1 && services && services.length === 0) {
    router = new express.Router();
    servicesCount = 0;
    global.services = {};
  }

  if (!services || !services.length || servicesCount === services.length) {
    return;
  }

  servicesCount = services.length;
  router = new express.Router();

  services.forEach(async (service) => {
    const {
      metadata,
      spec
    } = service;

    const {
      port,
      name: portName
    } = spec.ports[0];

    /**
     * Checks ensure that `metadata` and `spec` are in response's body
     */
    if (!metadata) {
      throw new InternalServerError('metadata not defined for service.');
    }

    if (!spec) {
      throw new InternalServerError('spec not defined for service.');
    }

    const { labels, namespace, name } = metadata;

    if (!labels) {
      throw new InternalServerError(`labels not defined for ${namespace}:${name}.`);
    }

    // eslint-disable-next-line object-curly-newline
    const { path, version, secured, expose } = labels;

    // Do not expose service
    if (expose === 'false') {
      return;
    }

    if (!path) {
      throw new InternalServerError(`path not defined for ${namespace}:${name}.`);
    }

    // v1 is automatically appended if version is not specified
    const servicePath = `/api/${version || 'v1'}/${path}`;

    // Make services known to entire application by assigning to `global`
    global.services[name] = { port, portName, secured };

    switch (portName) {
      case 'grpc':
        _proxyGrpc(name, port); break;
      default:
        _proxyHttp(name, port, servicePath);
    }
  });
}

/**
 * @param {Object} app
 * @param {Array} protos proto definitions to be mapped with http methods
 */
export default async function proxy(app, protos) {
  global.services = {};
  grpcProxy.loadServices(protos);

  // Set reference to router
  app.use((req, res, next) => router(req, res, next));
  await discoverRoutes();

  // Discover routes at a 5 second interval
  setInterval(discoverRoutes, process.env.SVC_DISCOVERY_INTERVAL || 5000);
}
