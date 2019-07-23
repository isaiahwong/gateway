/* eslint-disable no-unused-vars */
import fetch from 'node-fetch';
import Bluebird from 'bluebird';
import logger from 'esther';
import { filter } from 'lodash';
import pathToRegexp from 'path-to-regexp';
import { InternalServerError, NotAuthorized } from 'horeb';

fetch.Promise = Bluebird;

const AUTH_SERVICE = process.env.AUTH_SERVICE || 'auth-service';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || '/api/v1/auth/';

/**
 * Authentication Middleware
 */
export default async function auth(req, res, next) {
  if (!global.services || !global.services[AUTH_SERVICE]) {
    logger.error('Auth service is not discovered or not started');
    next(new InternalServerError()); return;
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
    servicePath: authPath,
    port: authPort,
  } = global.services[AUTH_SERVICE];

  const {
    authentication: {
      required,
      exclude
    } = {
      required: false,
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
