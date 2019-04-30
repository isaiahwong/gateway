/* eslint camelcase: 0 */
import { config, Client1_10 } from 'kubernetes-client';

import logger from './logger';

class K8sClient {

  constructor() {
    // Allows running app without loading app in k8s cluster
    this.disableClient = process.env.DISABLE_K8S_CLIENT;
    this.client = (this.disableClient !== 'true') ? 
      new Client1_10({ config: config.getInCluster() }) 
      :
      null;
    
    this.isActive = !!this.client;
  }

  /**
   * Queries k8s for services
   * @param namespace services in which namespace it resides
   * @returns Proxy object with handlers for `ws` and `web` requests
   */
  async getServices(namespace = 'default', serviceType = 'resource') {
    if (!this.isActive) {
      logger.warn('K8S is disabled');
      return null;
    }
    const response = await this.client.api.v1.namespace(namespace).services.get();
    if (!response || response.statusCode !== 200 || !response.body || !response.body.items) {
      return null;
    }

    /** Filters response based on labels of service type resource */
    return response.body.items.filter(({ metadata }) =>
      metadata && metadata.labels && metadata.labels.serviceType && metadata.labels.serviceType === serviceType
    );
  }

  getNamespaces() {
    return this.isActive && this.client.api.v1.namespaces('default').get() || null;
  }

}

export default new K8sClient();
