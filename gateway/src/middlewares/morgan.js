// Logs request to console as well as log files
import morgan from 'morgan';
import { omit } from 'lodash';
import logger from '../libs/logger';

export default morgan((tokens, req, res) => {
  // retrieved from morgan lib
  const message = [
    `[${tokens.method(req, res)}]`,
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ');

  // logger format 
  const toBeLogged = {
    httpRequest: {
      status: res.statusCode,
      requestUrl: req.url,
      requestMethod: req.method,
      remoteIp: req.connection.remoteAddress,
    },
    method: req.method,
    originalUrl: req.originalUrl,
    referrer: tokens['referrer'](req, res),
    remoteAddr: tokens['remote-addr'](req, res),
    // don't send sensitive information that only adds noise
    headers: omit(req.headers, ['x-api-key', 'cookie', 'password', 'confirmPassword']),
    body: omit(req.body, ['password', 'confirmPassword']),
    responseTime: `${tokens['response-time'](req, res)} ms`
  };

  // Do not log liveniness probe
  if (req.originalUrl === '/hz') {
    return null;
  }

  logger.route(message, toBeLogged);

  return null;
});
