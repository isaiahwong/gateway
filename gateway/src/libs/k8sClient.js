/* eslint camelcase: 0 */
import { config, Client1_10 } from 'kubernetes-client';
import logger from 'esther';

class K8sClient {
  constructor() {
    // Allows running app without loading app in k8s cluster
    this.disableClient = process.env.DISABLE_K8S_CLIENT;
    this.client = (this.disableClient !== 'true')
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

  /**
   * Queries k8s for services
   * @param namespace services in which namespace it resides
   * @returns Proxy object with handlers for `ws` and `web` requests
   */
  async getServices(namespace = 'default', labels = {}) {
    const { resourceType } = labels;
    const response = await this.client.api.v1.namespace(namespace).services.get();
    if (!response || response.statusCode !== 200 || !response.body || !response.body.items) {
      return null;
    }

    if (!resourceType) {
      return response.body.items;
    }

    /** Filters response based on labels of service type resource */
    return response.body.items.filter(({ metadata }) => metadata
      && metadata.labels
      && metadata.labels.resourceType
      && metadata.labels.resourceType === resourceType
    );
  }

  async getNamespaces(labels = {}) {
    const { resourceType } = labels;
    const response = await this.client.api.v1.namespaces().get();
    if (!response || response.statusCode !== 200 || !response.body || !response.body.items) {
      return null;
    }

    if (!resourceType) {
      return response.body.items;
    }

    return response.body.items.filter(({ metadata }) => metadata
      && metadata.labels
      && metadata.labels.resourceType
      && metadata.labels.resourceType === resourceType
    );
  }
}

export default new K8sClient();
