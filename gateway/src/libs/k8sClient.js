/* eslint camelcase: 0 */
import { config, Client1_10 } from 'kubernetes-client';

// Allows running app without loading app in k8s cluster
const disableClient = process.env.DISABLE_K8S_CLIENT;

let client = null;

if (disableClient !== 'true') {
  client = new Client1_10({ config: config.getInCluster() });
}

function getNamespaces() {
  return client && client.api.v1.namespaces('default').get() || null;
}

/**
 * Queries k8s for services
 * @param namespace services in which namespace it resides
 * @returns Proxy object with handlers for `ws` and `web` requests
 */
async function getServices(namespace = 'default', serviceType = 'resource') {
  if (!client) {
    return null;
  }
  const response = await client.api.v1.namespace(namespace).services.get();
  if (!response || response.statusCode !== 200 || !response.body || !response.body.items) {
    return null;
  }

  /** Filters response based on labels of service type resource */
  return response.body.items.filter(({ metadata }) =>
    metadata && metadata.labels && metadata.labels.serviceType && metadata.labels.serviceType === serviceType
  );
}

const clientInterface = {
  /** Function */
  getNamespaces,
  /** Function */
  getServices
};

export default clientInterface;
