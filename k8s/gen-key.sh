#!/usr/bin/env bash

# Generate a (self-signed) CA certificate and a certificate and private key to be used by the webhook server.
# The certificate will be issued for the Common Name (CN) of `webhook-server.gateway.svc`, which is the
# cluster-internal DNS name for the service.

: ${1?'missing key directory'}

key_dir="$1"

chmod 0700 "$key_dir"
cd "$key_dir"

# Generate the CA cert and private key
openssl req -nodes -new -x509 -keyout ca.key -out ca.crt -subj "/CN=Admission Controller Webhook CA"
# Generate the private key for the webhook server
openssl genrsa -out webhook-server-tls.key 2048
# Generate a Certificate Signing Request (CSR) for the private key, and sign it with the private key of the CA.
openssl req -new -key webhook-server-tls.key -subj "/CN=webhook-server.gateway-webhook.svc" \
    | openssl x509 -req -CA ca.crt -CAkey ca.key -CAcreateserial -out webhook-server-tls.crt
