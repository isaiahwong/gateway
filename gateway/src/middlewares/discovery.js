/* eslint-disable no-mixed-operators */
import express from 'express';
import logger from 'esther';
import bodyParser from 'body-parser';
import k8sClient from '../libs/k8sClient';
import Proxy from '../libs/proxy';
import GrpcProxy from '../libs/grpcProxy';

import auth from './auth';

const grpcProxy = new GrpcProxy();
let router = new express.Router();
/** Service Counter to keep track of existing services. */
let servicesCount = 0;

async function _proxyHttp(serviceName, port, servicePath) {
  logger.info(`[HTTP] Proxying to ${serviceName}`);
  router.use(servicePath, [auth], (req, res) => {
    /** Proxies request to matched service */
    Proxy.web(req, res, {
      target: `http://${serviceName}:${port}${servicePath}`
    });
  });
}

async function _proxyGrpc(serviceName, port) {
  try {
    const svc = await grpcProxy.startClient(serviceName, port);
    if (!svc) return;
  }
  catch (err) {
    logger.error(err);
  }
  const httpOptions = grpcProxy.getHttpOptions(serviceName);

  logger.info(`[GRPC] Proxying to ${serviceName}`);
  // Create router mappings for GRPC methods with http endpoints
  httpOptions.forEach(({ path: httpPath, method, body }) => {
    if (!httpPath || !method) {
      logger.warn(`${!httpPath && 'Http path and ' || ''} ${!method && 'method' || ''} is not defined.`);
      return;
    }
    router[method](
      httpPath,
      [
        bodyParser.json({
          verify(req, res, buf) {
            if (req.originalUrl && req.originalUrl.includes('/webhook')) {
              req.buf = buf;
            }
          },
        }),
        auth
      ],
      async (req, res, next) => {
        try {
          await grpcProxy.call(req, res, next,
            {
              serviceName,
              port,
              method,
              body
            }
          );
          return;
        }
        catch (err) {
          logger.error(err);
          next(err);
        }
      });
  });
}

async function applyRoutes(services = []) {
  router = new express.Router();
  services.forEach(async (service) => {
    const {
      metadata,
      spec
    } = service;

    if (!metadata) {
      logger.warn('metadata not defined for service.');
      return;
    }
    if (!spec) {
      logger.warn('spec not defined for service.');
      return;
    }

    const { annotations, namespace, name: serviceName } = metadata;
    if (!annotations || !annotations.config) {
      logger.warn(`annotations.config not defined for ${namespace}:${serviceName}.`);
      return;
    }

    let config = null;

    try {
      config = JSON.parse(annotations.config);
    }
    catch (err) {
      const msg = `${namespace}:${serviceName} `;
      logger.error(msg, err);
      return;
    }

    // eslint-disable-next-line object-curly-newline
    const { path, version, authentication, expose } = config;
    // Do not expose service
    if (expose === 'false') {
      return;
    }
    if (!path) {
      logger.warn(`path not defined for ${namespace}:${serviceName}.`);
      return;
    }
    if (!spec.ports) {
      logger.warn(`ports not defined for ${namespace}:${serviceName}`);
      return;
    }

    // v1 is automatically appended if version is not specified
    const servicePath = `/api/${version || 'v1'}/${path}`;
    spec.ports.forEach((_port) => {
      const {
        port,
        name: portName
      } = _port;

      // Make services known to entire application by assigning to `global`
      global.services[serviceName] = {
        port,
        portName,
        authentication,
        serviceName,
        servicePath
      };
      switch (portName) {
        case 'grpc':
          _proxyGrpc(serviceName, port); break;
        default:
          _proxyHttp(serviceName, port, servicePath);
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
  const namespaces = await k8sClient.getNamespaces({ resourceType: 'api-namespace' });
  const promises = await namespaces.map(async ({ metadata }) => {
    const { name } = metadata;
    return k8sClient.getServices(name, { resourceType: 'api-service' });
  });

  if (!promises || !promises.length) {
    return;
  }

  const [services] = await Promise.all(promises);

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
  applyRoutes(services);
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

  // Discover routes at an interval
  setInterval(discoverRoutes, process.env.SVC_DISCOVERY_INTERVAL || 5000);
}
