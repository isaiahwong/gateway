/* eslint-disable no-unused-expressions */
/**
 * Logging 
 */
import winston from 'winston';
import { LoggingWinston as Stackdriver } from '@google-cloud/logging-winston';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import { CustomError } from './errors';

const IS_TEST = process.env.NODE_ENV === 'test';

const ENABLE_CONSOLE_LOGS_IN_TEST = process.env.ENABLE_CONSOLE_LOGS_IN_TEST === 'true';
const SERVICE_NAME = 'gateway-service';

const { format } = winston;
const colorizer = winston.format.colorize();

// Custom Logging Levels
const config = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4,
    route: 5,
    verbose: 6,
    silly: 7,
  },
  colors: {
    error: 'red',
    debug: 'blue',
    warn: 'yellow',
    data: 'green',
    info: 'magenta',
    route: 'green',
    verbose: 'cyan',
    silly: 'grey',
  }
};

winston.addColors(config.colors);

// Create the directory if it does not exist
const logDirectory = path.join(__dirname, '..', '..', 'logs');
if (__DEV__ && !fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

/**
 * Log only the messages the match `level`.
 */
const LEVEL = Symbol.for('level');
function filterOnly(level) {
  return format((info) => {
    if (info[LEVEL] === level) {
      return info;
    }
    return null;
  })();
}

const stackdriver = new Stackdriver({
  level: 'verbose', // Log only if info.level less than or equal to this level
  levels: config.levels,
  serviceContext: {
    service: SERVICE_NAME,
    version: '1.0.0'
  },
  labels: {
    name: SERVICE_NAME,
    version: '1.0.0'
  },
  prefix: SERVICE_NAME
});

// Reusable console config 
const consoleConfig = new winston.transports.Console({
  level: 'verbose', // Log only if info.level less than or equal to this level
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.simple(),
    winston.format.printf((msg) => {
      let parsedMsg;
      if (msg.message) {
        if (typeof msg.message !== 'string') {
          parsedMsg = JSON.stringify(msg.message);
        }
        else {
          parsedMsg = msg.message;
        }
      }
      return `${colorizer.colorize('warn', `[${msg.timestamp}]`)} ${colorizer.colorize(msg.level, `${parsedMsg}`)}`;
    })
  )
});

const fileTransports = [
  {
    file: '/info.log',
    level: 'info'
  },
  {
    file: '/route.log',
    level: 'route'
  },
  {
    file: '/warn.log',
    level: 'warn'
  },
  {
    file: '/error.log',
    level: 'error'
  },
].map(({ file, level }) =>
  new winston.transports.File({
    filename: path.join(logDirectory, file),
    level: level,
    format: filterOnly(level)
  })
);

const localLogger = winston.createLogger({
  level: 'verbose', // Log only if info.level less than or equal to this level
  levels: config.levels,
  transports: [
    ...fileTransports
  ]
});

// Do not log anything when testing unless specified
if (!IS_TEST || IS_TEST && ENABLE_CONSOLE_LOGS_IN_TEST) {
  localLogger.add(consoleConfig);
}

const cloudLogger = winston.createLogger({
  level: 'route',
  levels: config.levels,
  transports: [
    new winston.transports.Console(),
    stackdriver
  ]
});

const logger = __PROD__ ? cloudLogger : localLogger;

// exports a public interface instead of accessing directly the logger module
const loggerInterface = {
  info(msg, ...args) {
    logger.info(msg, ...args);
  },

  verbose(...args) {
    logger.verbose(...args);
  },

  route(msg, ...args) {
    logger.route(msg, ...args);
  },

  warn(msg, ...args) {
    logger.warn(msg, ...args);
  },

  // Accepts two argument,
  // an Error object (required)
  // and an object of additional data to log alongside the error
  // If the first argument isn't an Error, it'll call logger.error with all the arguments supplied
  error(...args) {
    const [err, errorData = {}, ...otherArgs] = args;

    if (err instanceof Error) {
      // pass the error stack as the first parameter to logger.error
      const stack = err.stack || err.message || err;

      if (_.isPlainObject(errorData) && !errorData.fullError) {
        // If the error object has interesting data (not only httpCode, message and name from the CustomError class)
        // add it to the logs
        if (err instanceof CustomError) {
          const errWithoutCommonProps = _.omit(err, ['name', 'httpCode', 'message']);

          if (Object.keys(errWithoutCommonProps).length > 0) {
            errorData.fullError = errWithoutCommonProps;
          }
        }
        else {
          errorData.fullError = err;
        }
      }

      const loggerArgs = [stack, errorData, ...otherArgs];

      // Treat 4xx errors that are handled as warnings, 5xx and uncaught errors as serious problems
      if (!errorData || !errorData.isHandledError || errorData.httpCode >= 500) {
        logger.error(...loggerArgs);
      }
      else {
        logger.warn(...loggerArgs);
      }
    }
    else {
      logger.error(...args);
    }
  },
};

export default loggerInterface;