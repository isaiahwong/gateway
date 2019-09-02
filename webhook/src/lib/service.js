import path from 'path';
import { GrpcClient } from 'grpc-utils';

const defaultRetries = {
  deadline: Number.POSITIVE_INFINITY,
  rpcMaxRetries: 5,
  rpcRetryInterval: 3000
};

class GatewayService extends GrpcClient {
  constructor(
    protoPath = path.join(__dirname, '..', '..', 'proto/gateway/webhook.proto'),
    serviceURL = process.env.GATEWAY_SERVICE || 'gateway-service.default.svc.cluster.local:50051'
  ) {
    super(protoPath, {
      serviceURL,
      ...defaultRetries
    });
  }
}

export default GatewayService;
