import fetch from 'node-fetch';
import Bluebird from 'bluebird';

import logger from '../libs/logger';
import { InternalServerError, NotAuthorized } from '../libs/errors';

fetch.Promise = Bluebird;

const AUTH_SERVICE = process.env.AUTH_SERVICE || 'authservice';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || '/v1/auth/';

/**
 * Authentication Middleware
 */
export default async function auth(req, res, next) {
  // if (!global.services || !global.services[AUTH_SERVICE]) {
  //   logger.error('Auth service is not discovered or not started');
  //   next(new InternalServerError()); return;
  // }

  // const { port, secured } = global.services[AUTH_SERVICE];

  // // Env are treated as strings hence comparing it to literal value
  // if (secured === 'false') {
  //   next(); return;
  // }

  // const response = await fetch(
  //   `http://${AUTH_SERVICE}:${port}${AUTH_SERVICE_URL}`,
  //   {
  //     method: 'post',
  //     headers: req.headers,
  //   });

  // if (response.status === 401) {
  //   next(new NotAuthorized()); return;
  // }
  next();
}