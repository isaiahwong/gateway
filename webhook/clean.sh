#!/usr/bin/env bash
kubectl delete -f deployment/deployment.yaml.template
kubectl delete secrets -n gateway webhook-server-tls
kubectl delete namespaces gateway