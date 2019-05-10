import fs from 'fs';
import grpc from 'grpc';

import * as protoLoader from './protoLoader';

function loadProto(fileName, include) {
  const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  };

  if (Array.isArray(include) && include.length) {
    options.includeDirs = [...include];
  }

  const packageDefinition = protoLoader.loadSync(
    fileName,
    options
  );
  return grpc.loadPackageDefinition(packageDefinition);
}

/**
 * Loads proto files
 * @param {Array}
 * @param {String} filePath Dire
 * @param {Array} relativeInclude Directory has to be relative to where it is being loaded from
 * @returns {Array} protos
 */
function loadProtos(protos = [], filePath, relativeInclude) {
  fs
    .readdirSync(filePath)
    .forEach((fileName) => {
      if (!fs.statSync(filePath + fileName).isFile()) { // Folder
        loadProtos(protos, `${filePath}${fileName}/`, relativeInclude);
      }
      else if (fileName.match(/\.proto$/) && !filePath.match(/third_party/)) { // exclude third party
        const proto = (!relativeInclude || !relativeInclude.length)
          ?
          loadProto(filePath + fileName) 
          :
          loadProto(fileName, relativeInclude);
        protos.push(proto);
      }
    });
}

const grpcInterface = {
  loadProtos,
  loadProto
};

export default grpcInterface;