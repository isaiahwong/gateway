#!/usr/bin/env bash
set -euo pipefail

basedir="$(dirname "$0")/k8s"
keydir="$(dirname "$0")/webhook-cert"

echo "$(pwd | pbcopy)"


rm -r $keydir
mkdir $keydir

# Generate keys into a temporary directory.
echo "Generating TLS keys ..."
"${basedir}/gen-key.sh" "$keydir"

ca_pem_b64="$(openssl base64 -A <"${keydir}/ca.crt")"
tls_crt="$(cat ${keydir}/webhook-server-tls.crt | base64)"
tls_key="$(cat ${keydir}/webhook-server-tls.key | base64)"

# Replaces the crt and key in gateway.yaml
find $basedir -name "gateway.yaml" -exec sed -i '' -e "s/tls.crt:.*/tls.crt: ${tls_crt}/g; s/tls.key:.*/tls.key: ${tls_key}/g;" {} +;

# Replaces the cabundle in gateway.yaml
find $basedir -name "gateway.yaml" -exec sed -i '' -e"s/caBundle:.*/caBundle: ${ca_pem_b64}/g;" {} +;


echo "k8s/gateway.yaml has been interpolated with keys"
