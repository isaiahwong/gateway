import fs from 'fs';
import grpc from 'grpc';

import * as protoLoader from './protoLoader';

class Grpc {
  static handler(call, callback) {
    try {
      callback(null, '');
    }
    catch (err) {
      console.warn(err);
      callback(err);
    }
  }

  listen() {
    this.server.bind(`0.0.0.0:${this.port}`, grpc.ServerCredentials.createInsecure());
    this.server.start();
  }

  loadProto(fileName, include) {
    const options = {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    };

    if (Array.isArray(include) && include.length) {
      options.includeDirs = [...include, fileName];
    }

    const packageDefinition = protoLoader.loadSync(
      fileName,
      options
    );
    return grpc.loadPackageDefinition(packageDefinition);
  }

  loadProtos(filePath, include) {
    const protos = [];
    fs
      .readdirSync(filePath)
      .forEach((fileName) => {
        if (!fs.statSync(filePath + fileName).isFile()) { // Folder
          this.loadProtos(`${filePath}${fileName}/`);
        }
        else if (fileName.match(/\.proto$/) && !filePath.match(/third_party/)) { // exclude third party
          const proto = this.loadProto(fileName, include);
          console.log(proto.auth.AuthService)
          protos.push(proto);
        }
      });
    return protos;
  }

  loadAllServices() {
    const authPackage = this.packages.authService.auth;

    this.server.addService(
      authPackage.AuthService.service,
      {
        charge: authPackage.handler.bind(this)
      }
    );
  }
}

export default Grpc;