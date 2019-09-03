/* eslint-disable no-plusplus */
/* eslint camelcase: 0 */
import { config, Client1_10 } from 'kubernetes-client';
import logger from 'esther';

class K8sClient {
  constructor() {
    // Allows running app without loading app in k8s cluster
    this.disableClient = process.env.DISABLE_K8S_CLIENT === 'true';
    this.client = (!this.disableClient)
      ? new Client1_10({ config: config.getInCluster() })
      : null;
    this.isActive = !!this.client;

    Object.getOwnPropertyNames((Object.getPrototypeOf(this)))
      .forEach((prop) => {
        if (prop === 'constructor') {
          return;
        }
        if (typeof this[prop] === 'function') {
          const initalFn = this[prop].bind(this);
          this[prop] = (...args) => {
            if (!this.isActive) {
              logger.warn('K8S is disabled');
              return null;
            }
            return initalFn(...args);
          };
        }
      });
  }

  static filter(labels) {
    return ({ metadata }) => {
      let match = true;
      if (metadata && metadata.labels) {
        const labelKeys = Object.keys(labels);
        if (!labelKeys) {
          match = false; return match;
        }
        for (let i = 0; i < labelKeys.length; i++) {
          const key = labelKeys[i];
          if (!metadata.labels[key]) {
            match = false; return match;
          }
          if (metadata.labels[key] !== labels[key]) {
            match = false; return match;
          }
        }
      }
      return match;
    };
  }

  /**
   * Queries k8s for services
   * @param namespace services in which namespace it resides
   * @returns Proxy object with handlers for `ws` and `web` requests
   */
  async getServices(namespace = 'default', labels) {
    const response = await this.client.api.v1.namespace(namespace).services.get();
    if (!response || response.statusCode !== 200 || !response.body || !response.body.items) {
      return null;
    }

    if (!labels) {
      return response.body.items;
    }

    /** Filters response based on labels of service type resource */
    return response.body.items.filter(K8sClient.filter(labels));
  }

  async getNamespaces(labels) {
    const response = await this.client.api.v1.namespaces().get();
    if (!response || response.statusCode !== 200 || !response.body || !response.body.items) {
      return null;
    }

    if (!labels) {
      return response.body.items;
    }

    return response.body.items.filter(K8sClient.filter(labels));
  }
}

export default new K8sClient();
