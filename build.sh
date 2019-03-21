#!/usr/bin/env bash
eval $(minikube docker-env)

skaffold config set --global local-cluster true

make -C ./gateway

