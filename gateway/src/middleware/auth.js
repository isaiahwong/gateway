import fetch from 'node-fetch';
import Bluebird from 'bluebird';
import logger from 'esther';
import pathToRegexp from 'path-to-regexp';
import { NotAuthorized } from 'horeb';
import discovery from '../lib/discovery';

fetch.Promise = Bluebird;

const AUTH_SERVICE = process.env.AUTH_SERVICE || 'auth-service.default';

/**
 * Authentication Middleware
 */
export default async function auth(req, res, next) {
  console.log(!discovery.services[AUTH_SERVICE])
  if (!discovery.services || !discovery.services[AUTH_SERVICE]) {
    logger.warn('Auth service is not discovered or not defined. You can define an auth service in your environment AUTH_SERVICE=auth-service');
    next(); return;
  }
  const service = discovery.getServiceIncludesUrl(req.originalUrl);

  if (!service) {
    next(); return;
  }

  const { dnsPath: authName, ports } = discovery.services[AUTH_SERVICE];
  let { path: authPath } = discovery.services[AUTH_SERVICE];
  let authPort = ports[0].port;

  if (!authPort) {
    logger.warn('Auth port is not defined, using default port 5000');
    authPort = 5000;
  }

  if (!authPath) {
    logger.warn('Auth path is not defined, setting to /v1/auth');
    authPath = '/api/v1/auth';
  }

  const {
    authentication: {
      required,
      exclude
    } = {
      required: 'false',
      exclude: []
    }
  } = service;

  // Env are treated as strings hence comparing it to literal value
  if (required === 'false') {
    next(); return;
  }

  const excludePath = exclude.find((path) => {
    const regexp = pathToRegexp(path);
    // Find grpc with the mapped path
    return regexp.exec(req.originalUrl.split(/[?#]/)[0]);
  });

  if (excludePath) {
    next(); return;
  }

  // Query auth service
  const response = await fetch(
    `http://${authName}:${authPort}${authPath}`,
    {
      method: 'post',
      headers: req.headers,
    });

  if (response.status > 204) {
    next(new NotAuthorized()); return;
  }
  next();
}
