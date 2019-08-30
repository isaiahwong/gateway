import fetch from 'node-fetch';
import Bluebird from 'bluebird';
import logger from 'esther';
import { filter } from 'lodash';
import pathToRegexp from 'path-to-regexp';
import { NotAuthorized } from 'horeb';

fetch.Promise = Bluebird;

const AUTH_SERVICE = process.env.AUTH_SERVICE || 'auth-service';

/**
 * Authentication Middleware
 */
export default async function auth(req, res, next) {
  if (!global.services || !global.services[AUTH_SERVICE]) {
    logger.warn('Auth service is not discovered or not defined. You can define an auth service in your environment AUTH_SERVICE=auth-service');
    next(); return;
  }

  const service = filter(global.services, (svc) => {
    const { servicePath } = svc;
    return req.originalUrl.includes(servicePath);
  });

  if (!service || !service[0]) {
    next(); return;
  }

  const {
    serviceName: authName,
  } = global.services[AUTH_SERVICE];

  let {
    port: authPort,
    servicePath: authPath
  } = global.services[AUTH_SERVICE];

  if (!authPort) {
    logger.warn('Auth port is not defined, using default port 5000');
    authPort = 5000;
  }

  if (!authPath) {
    logger.warn('Auth path is not defined, setting to /v1/auth');
    authPath = '/v1/auth';
  }


  const {
    authentication: {
      required,
      exclude
    } = {
      required: true,
      exclude: []
    }
  } = service[0];

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

  if (response.status === 401) {
    next(new NotAuthorized()); return;
  }
  next();
}
