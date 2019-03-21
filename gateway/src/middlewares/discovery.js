import express from 'express';

import k8sClient from '../libs/k8sClient';

// import logger from '../libs/logger';
import { InternalServerError } from '../libs/errors';

/** create a proxy server */


let router = new express.Router();
/** Service Counter to keep track of existing services. */
let servicesCount = 0;

/**
 * Retrieves routes from k8s services and maps the paths for proxying
 * @metadata `labels` `namespace` `name`
 * @spec `ports`
 */
async function discoverRoutes(Proxy) {
  const services = await k8sClient.getServices('default');

  if (services && services.length && servicesCount !== services.length) {
    servicesCount = services.length;
    /** Creates a new router on new service discovered */
    router = new express.Router();

    services.forEach((service) => {
      const {
        metadata,
        spec
      } = service;

      /**
       * Checks ensure that `metadata` and `spec` are in response's body
       */
      if (!metadata) {
        throw new InternalServerError('metadata not defined for service.');
      }

      if (!spec) {
        throw new InternalServerError('spec not defined for service.');
      }

      const { labels, namespace, name } = metadata;

      if (!labels) {
        throw new InternalServerError(`labels not defined for ${namespace}:${name}.`);
      }

      const { path, version, secured } = labels;

      if (!path) {
        throw new InternalServerError(`path not defined for ${namespace}:${name}.`);
      }

      /** v1 is automatically appended if version is not specified */
      const url = `/api/${version || 'v1'}/${path}`;
      const port = spec.ports && spec.ports[0] && spec.ports[0].port && `:${spec.ports[0].port}`;

      router.use(url, (req, res) => (
        /** Proxies request to matched service */
        Proxy.web(req, res, {
          target: `http://${name}${port}${url}`
        })
      ));
    });
  }
}

export default async function discovery(app, Proxy) {
  // Set reference to router 
  app.use((req, res, next) => router(req, res, next));
  discoverRoutes(Proxy);

  // Discover routes at a 5 second interval
  setInterval(discoverRoutes, process.env.SVC_DISCOVERY_INTERVAL || 5000);
}