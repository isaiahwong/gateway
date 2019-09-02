import express from 'express';
import grpc from 'grpc';
import logger from 'esther';
import { InternalServerError } from 'horeb';

import GatewayService from '../lib/service';
import { createHmac } from '../lib/crypto';

const router = new express.Router();
const gateway = new GatewayService();
gateway.verbose = true;

const secret = process.env.WEBHOOK_SECRET_KEY || '791cd90305a12b0ce5c4ed148eb3d216472ce508';

router.post('/webhook', async (req, res) => {
  const payload = {
    body: Buffer.from(JSON.stringify(req.body))
  };
  const metadata = new grpc.Metadata();
  // create webhook signature for verification
  const sig = createHmac(JSON.stringify(req.body), secret);
  metadata.set('sig', sig);
  // We want to process this async to not jam the Kubernetes cluster
  gateway.discover(payload, metadata)
    .catch(err => logger.error(new InternalServerError(err)));
  res.ok();
});

router.all('/hz', (req, res) => {
  res.ok();
});


export default router;
