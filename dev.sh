#!/usr/bin/env bash

minikube addons enable ingress

kubectl apply -f ./k8s/nginx-ingress

kubectl apply -f ./k8s/
