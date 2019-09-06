/* eslint-disable no-mixed-operators */
import express from 'express';
import logger from 'esther';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import { InternalServerError } from 'horeb';
import k8sClient from '../lib/k8sClient';
import Proxy from '../lib/proxy';
import GrpcProxy from '../lib/grpcProxy';
import discovery, { ApiService } from '../lib/discovery';

import auth from './auth';

const grpcProxy = new GrpcProxy();
let router = new express.Router();
/** Service Counter to keep track of existing services. */

async function _proxyHttp(serviceName, dnsPath, port, path) {
  router.use(path, [auth], (req, res) => {
    /** Proxies request to matched service */
    Proxy.web(req, res, {
      target: `http://${dnsPath}:${port}${path}`
    });
  });
}

async function _proxyGrpc(serviceName, dnsPath, port) {
  try {
    const svc = await grpcProxy.startClient(serviceName, dnsPath, port);
    if (!svc) return;
  }
  catch (err) {
    logger.error(err);
  }
  /**
   * Extracts the http options specified in protobuf
   */
  const httpOptions = grpcProxy.getHttpOptions(serviceName);

  // Create router mappings for GRPC methods with http endpoints
  httpOptions.forEach(({ path: httpPath, method, body }) => {
    if (!httpPath || !method) {
      logger.warn(`${!httpPath && 'Http path and ' || ''} ${!method && 'method' || ''} is not defined.`);
      return;
    }
    // express router
    router[method](
      httpPath,
      [ // Middleware
        bodyParser.urlencoded({ extended: false }),
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
              dnsPath,
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

async function applyRoutes(services) {
  if (!services) return;

  router = new express.Router();

  Object.keys(services).forEach(async (serviceKey) => {
    const service = services[serviceKey];

    if (!(service instanceof ApiService)) {
      logger.error(new InternalServerError('Argument is not of ApiService'));
      return;
    }

    const {
      serviceName,
      ports,
      path,
      dnsPath
    } = service;

    ports.forEach((_port) => {
      const {
        port,
        name: portName
      } = _port;

      switch (portName) {
        case 'grpc':
          _proxyGrpc(serviceName, dnsPath, port); break;
        default:
          _proxyHttp(serviceName, dnsPath, port, path);
      }
    });
  });
}

/**
 * @param {Object} app
 * @param {Array} protos proto definitions to be mapped with http methods
 */
export default async function proxy(app, protos) {
  if (k8sClient.disableClient) {
    logger.warn('K8S discovery disabled');
    return;
  }
  global.services = {};
  grpcProxy.loadServices(protos);

  // Set reference to router
  app.use((req, res, next) => router(req, res, next));
  app.use(helmet.hidePoweredBy({ setTo: '' }));

  const services = await discovery.getAllServices();
  applyRoutes(services);
  discovery.on('discover', payload => applyRoutes(payload));
}
