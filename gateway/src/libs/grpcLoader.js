import fs from 'fs';
import grpc from 'grpc';

import * as protoLoader from './protoLoader';

class GrpcLoader {
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
          this.loadProtos(`${filePath}${fileName}/`, include);
        }
        else if (fileName.match(/\.proto$/) && !filePath.match(/third_party/)) { // exclude third party
          const proto = this.loadProto(fileName, include);
          protos.push(proto);
        }
      });
    return protos;
  }
}

export default GrpcLoader;