import fs from 'fs';
import _ from 'lodash';

import { getUserLanguage } from '../middlewares/language';

// Wrapper function to handler `async` route handlers that return promises
// It takes the async function, execute it and pass any error to next (args[2])
const _wrapAsyncFn = fn => (...args) => {
  const promise = fn(...args);
  return promise instanceof Promise ? promise.catch(args[2]) : promise;
};
const noop = (req, res, next) => next();

// Iterate through routes
export const iterate = (router, filePath) => {
  fs
    .readdirSync(filePath)
    .forEach((fileName) => {
      /* eslint-disable */
      if (!fs.statSync(filePath + fileName).isFile()) { // Folder
        iterate(router, `${filePath}${fileName}/`);
      } 
      else if (fileName.match(/\.js$/)) {
        const controller = require(filePath + fileName).default; 
        if (!controller) return;
        _.each(controller, ((action) => {
          let { 
            method, 
            url,
            middlewares = [], 
            handler 
          } = action;

          // preset middlewares
          middlewares.push(
            getUserLanguage
          );

          method = method.toLowerCase();
          const fn = handler ? _wrapAsyncFn(handler) : noop;
          router[method](url, ...middlewares, fn);
        }));
      }
    });
};
