/* eslint-disable class-methods-use-this */
import EventEmitter from 'events';
import { isURL } from 'validator';
import { filter } from 'lodash';
import logger from 'esther';
import { InternalServerError } from 'horeb';

import k8sClient from './k8sClient';

export class ApiService {
  constructor(args = {}) {
    const properties = [
      'path',
      'dnsPath', // <service-name>.<namespace-name>.svc.cluster.local
      'ports',
      'authentication',
      'serviceName',
      'namespace',
      'apiVersion',
      'resourceType',
    ];
    // eslint-disable-next-line no-return-assign
    properties.forEach((key) => {
      if (!args[key]) {
        logger.error(new InternalServerError(`ApiService Constructor: ${key} is required`));
      }
      this[key] = args[key];
    });
  }
}

class Discovery extends EventEmitter {
  constructor() {
    super();
    this.services = {};
    this.labelResourceType = process.env.LABEL_RESOURCE_TYPE || 'api-service';

    this._createService = this._createService.bind(this);
  }

  _createService(object) {
    if (!object) {
      logger.warn('Require kubernetes object'); return;
    }

    const {
      metadata, // Kubernetes Service metadata
      spec // Kubernetes Service Spec
    } = object;

    if (!metadata) {
      logger.warn('metadata not defined'); return;
    }
    // Filters resource not labeled api-service
    // TODO Condition to be refactored with configurations
    if (!metadata.labels
      || !metadata.labels.resourceType
      || metadata.labels.resourceType !== this.labelResourceType) {
      logger.warn(`resourceType is not of ${this.labelResourceType}`);
      return;
    }
    if (!spec) {
      logger.warn('spec not defined'); return;
    }
    if (!spec.ports) {
      logger.warn('spec ports not defined'); return;
    }

    let serviceConfig;
    const {
      annotations, labels: { resourceType },
      namespace, name: serviceName,
    } = metadata;

    const name = `${serviceName}.${namespace}`;

    // Define default values if annotation is not specified
    if (!annotations || !annotations.config) {
      serviceConfig = {
        path: `/api/v1/${serviceName}`,
        authentication: {
          required: false
        }
      };
    }
    else {
      try {
        serviceConfig = JSON.parse(annotations.config);
      }
      catch (err) {
        const msg = `${namespace}:${serviceName} `;
        logger.error(msg, err);
        return;
      }
    }
    // eslint-disable-next-line object-curly-newline
    const { path, apiVersion, authentication } = serviceConfig;

    this.services[name] = new ApiService({
      path: ((!path || !isURL(path)) && path) || `/api/${apiVersion || 'v1'}/${serviceName}`,
      dnsPath: `${name}.svc.cluster.local`,
      ports: spec.ports,
      authentication,
      serviceName,
      namespace,
      apiVersion,
      resourceType,
    });
  }

  getServiceIncludesUrl(url = '') {
    const service = filter(this.services, svc => url.includes(svc.path));
    return (service && service.length && service[0]) || undefined;
  }

  async getAllServices() {
    const namespaces = await k8sClient.getNamespaces();

    (await Promise.all(namespaces
      .map(({ metadata: { name: namespace } }) => k8sClient
        .getServices(namespace, {
          resourceType: process.env.LABEL_RESOURCE_TYPE || this.labelResourceType
        })
      )))
      .filter(arr => !!arr.length)
      .forEach(services => services.forEach(this._createService));
    return this.services;
  }


  discover(payload) {
    if (!payload || !payload.request) {
      return;
    }
    const {
      request: {
        operation, kind,
        object, name, namespace
      }
    } = payload;

    if (!kind || !kind.kind || kind.kind.toLowerCase() !== 'service') {
      return;
    }

    switch (operation) {
      case 'CREATE': {
        if (!object) return;
        this._createService(object);
        this.emit('discover', this.services);
        break;
      }
      case 'DELETE': {
        delete this.services[`${name}.${namespace}`];
        break;
      }
      default:
        return;
    }
    this.emit('discover', this.services);
  }
}

export default new Discovery();
