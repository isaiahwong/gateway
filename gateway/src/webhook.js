import path from 'path';
import grpc from 'grpc';
import logger from 'esther';
import crypto from 'crypto';
import { grpcLoader } from 'grpc-utils';
import {
  InternalServerError, BadRequest,
} from 'horeb';

import Discovery from './libs/discovery';

const PROTO_PATH = path.join(__dirname, '..', 'proto/gateway/webhook.proto');
const secret = process.env.WEBHOOK_SECRET_KEY || '791cd90305a12b0ce5c4ed148eb3d216472ce508';

class WebhookServer {
  constructor() {
    this._port = process.env.GRPC_PORT || 50051;
    this._server = new grpc.Server();
    // Load proto to be injected to Grpc Server
    const proto = grpcLoader.loadProto(PROTO_PATH);
    this.loadCoreServices(proto);
  }

  static discover(call, cb) {
    const { request, metadata } = call;
    const { body } = request;
    const data = body.toString();
    const checksum = metadata.get('sig')[0];
    const digest = crypto.createHmac('sha1', secret).update(data).digest('hex');

    if (checksum !== digest) {
      cb(new BadRequest('Invalid Checksum')); return;
    }
    // completes the grpc call
    cb(null);
    let configuration;
    try {
      configuration = JSON.parse(data);
    }
    catch (err) {
      logger.error(new InternalServerError(err)); return;
    }
    Discovery.discover(configuration);
  }

  loadCoreServices(proto) {
    if (!proto) {
      throw new InternalServerError('protos not found');
    }
    this.pkg = Object.keys(proto)[0];
    if (!this.pkg) {
      throw new InternalServerError('package not found');
    }
    this.service = Object.keys(proto[this.pkg])[0];

    this._server.addService(
      proto[this.pkg][this.service].service,
      {
        discover: WebhookServer.discover
      }
    );
  }

  listen() {
    this._server.bind(`0.0.0.0:${this._port}`, grpc.ServerCredentials.createInsecure());
    this._server.start();
    logger.info(`${this.service} grpc server listening on ${this._port}`);
  }
}

export default WebhookServer;
