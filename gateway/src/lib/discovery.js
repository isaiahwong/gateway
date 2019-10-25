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

    const optionals = [
      'method'
    ];

    // eslint-disable-next-line no-return-assign
    properties.forEach((key) => {
      if (!args[key]) {
        logger.error(
          new InternalServerError(`ApiService Constructor: ${key} is required`)
        );
      }
      this[key] = args[key];
    });

    // eslint-disable-next-line no-return-assign
    optionals.forEach(key => this[key] = args[key]);
  }
}

class Method {
  static GET = 'get';

  static POST = 'post';

  static USE = 'use';

  constructor() {
    throw new InternalServerError('Do not instantiate. Use static types only');
  }

  static isValid(resourceType) {
    switch (resourceType) {
      case Method.GET:
      case Method.POST:
      case Method.USE:
        return true;
      default:
        return false;
    }
  }
}

class ResourceType {
  static ApiService = 'api-service';

  static ClientService = 'client-service';

  constructor() {
    throw new InternalServerError('Do not instantiate. Use static types only');
  }

  static isValid(resourceType) {
    switch (resourceType) {
      case ResourceType.ApiService:
      // case ResourceType.ClientService:
        return true;
      default:
        return false;
    }
  }
}

class Discovery extends EventEmitter {
  constructor() {
    super();
    this.services = {};
    this.serviceCount = 0;
    this._create = this._create.bind(this);
  }

  updateCount() {
    this.serviceCount = Object.keys(this.services).length;
  }

  _create(object) {
    if (!object) {
      logger.warn('Require kubernetes object');
      return;
    }

    const {
      metadata, // Kubernetes Service metadata
      spec // Kubernetes Service Spec
    } = object;

    if (!metadata) {
      logger.warn('metadata not defined');
      return;
    }
    // Filters resource not labeled api-service
    // TODO Condition to be refactored with configurations
    if (!metadata.labels || !metadata.labels.resourceType) {
      logger.warn('resourceType not defined.');
      return;
    }
    if (!ResourceType.isValid(metadata.labels.resourceType)) {
      logger.warn('Invalid resource type');
      return;
    }
    if (!spec) {
      logger.warn('spec not defined');
      return;
    }
    if (!spec.ports) {
      logger.warn('spec ports not defined');
      return;
    }

    let serviceConfig;
    const {
      annotations,
      labels: { resourceType },
      namespace,
      name: serviceName
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
    const { path, apiVersion, authentication, method } = serviceConfig;

    // We assign method get to client resource type
    const _method = resourceType === ResourceType.ClientService
      ? Method.GET
      : (Method.isValid(method) && method) || Method.USE;

    this.services[name] = new ApiService({
      path:
        ((!path || !isURL(path)) && path)
        || `/api/${apiVersion || 'v1'}/${serviceName}`,
      dnsPath: `${name}.svc.cluster.local`,
      ports: spec.ports,
      authentication,
      serviceName,
      namespace,
      apiVersion,
      resourceType,
      method: _method
    });
    this.updateCount();
  }

  _delete(name, namespace) {
    delete this.services[`${name}.${namespace}`];
    this.updateCount();
  }

  getServiceIncludesUrl(url = '') {
    const service = filter(this.services, svc => url.includes(svc.path));
    return (service && service.length && service[0]) || undefined;
  }

  async getAllServices() {
    const namespaces = await k8sClient.getNamespaces();

    (await Promise.all(
      namespaces.map(({ metadata: { name: namespace } }) => k8sClient.getServices(namespace)
      )
    ))
      .filter(arr => !!arr.length)
      .forEach(services => services
        .filter(
          service => service
              && service.metadata
              && service.metadata.labels
              && service.metadata.labels.resourceType
              && ResourceType.isValid(service.metadata.labels.resourceType)
        )
        .forEach(this._create)
      );
    return this.services;
  }

  discover(payload) {
    if (!payload || !payload.request) {
      return;
    }
    const {
      request: {
        operation, kind, object, name, namespace
      }
    } = payload;

    if (!kind || !kind.kind || kind.kind.toLowerCase() !== 'service') {
      return;
    }

    switch (operation) {
      case 'CREATE': {
        if (!object) return;
        this._create(object);
        break;
      }
      case 'DELETE': {
        this._delete(name, namespace);
        break;
      }
      default:
        return;
    }
    this.emit('discover', this.services);
  }
}

export default new Discovery();
