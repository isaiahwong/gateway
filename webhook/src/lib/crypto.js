import crypto from 'crypto';

export function createHmac(data, secret) {
  return crypto.createHmac('sha1', secret).update(data).digest('hex');
}
