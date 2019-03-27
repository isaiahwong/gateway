/**
 * Logging for API
 * TODO:
 * Persist Logs into db or transmits to log service
 */
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import { CustomError } from './errors';

const IS_TEST = process.env.NODE_ENV === 'test';

const ENABLE_CONSOLE_LOGS_IN_TEST = process.env.ENABLE_CONSOLE_LOGS_IN_TEST === 'true';
const ENABLE_CONSOLE_LOGS_IN_PROD = process.env.ENABLE_CONSOLE_LOGS_IN_PROD === 'true';

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
    custom: 8
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
    custom: 'yellow'
  }
};

winston.addColors(config.colors);

// Create the directory if it does not exist
const logDirectory = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDirectory)) {
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

const logger = winston.createLogger({
  level: 'data', // Log only if info.level less than or equal to this level
  levels: config.levels,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.json()
  ),
  timestamp: winston.format.timestamp(),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDirectory, '/info.log'), 
      level: 'info',
      format: filterOnly('info')
    }),
    new winston.transports.File({ 
      filename: path.join(logDirectory, '/route.log'), 
      level: 'route',
      format: filterOnly('route')
    }),
    new winston.transports.File({ 
      filename: path.join(logDirectory, '/warn.log'), 
      level: 'warn',
      format: filterOnly('warn')
    }),
    new winston.transports.File({ 
      filename: path.join(logDirectory, '/error.log'), 
      level: 'error',
      format: filterOnly('error')
    })
  ]
});

if (__PROD__) {
  if (ENABLE_CONSOLE_LOGS_IN_PROD) {
    logger
      .add(consoleConfig);
  }
}
// Do not log anything when testing unless specified
else if (!IS_TEST || IS_TEST && ENABLE_CONSOLE_LOGS_IN_TEST) { 
  logger
    .add(consoleConfig);
}


// exports a public interface instead of accessing directly the logger module
const loggerInterface = {
  info(...args) {
    logger.info(...args);
  },

  verbose(...args) {
    logger.verbose(...args);
  },

  route(msg, ...args) {
    logger.route(msg, ...args);
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