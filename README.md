# Gateway
`Gateway` provides a `REST` entry point amalgamating your microservices in your [Kubernetes][k8s] cluster with **configuration**. `Gateway` relies Kubernetes's [NGINX ingress][ingress-nginx] for routing. `Gateway` [discovers](#discovery) your cluster for exposed `HTTP` and `gRPC` [services][k8s-service] and makes them available through a single entry point. `Gateway` works on (local) and Google Kubernetes Engine.

`Gateway` depends on Kubernetes's [Service Discovery][k8s-svc-discovery]. Currently it depends on Kubernetes Client - [GoDaddy Client][godaddy-client]

# Table of Contents
* [Getting Started](#getting-started)
* [Gateway](#gateway)
* [Directory Layout](#Directory-Layout)
* [Technology Stack](#technology-stack)

# Quickstart

# Installation
Starting a local version of the cluster on your development machine.  
Install these tools to run Kubernetes cluster locally 

1. Installation
   - [kubectl][kubectl] (Kubernetes CLI)
   - [Docker Desktop][docker-desktop]
   - [Skaffold][skaffold] Application is deployed to Kubernetes with a single command using Skaffold

2. Launch Docker Desktop
   - Kubernetes > Enable Kubernetes

3. Run `skaffold dev`

## Without skaffold

Installing `nginx-ingress`
```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/mandatory.yaml

or

kubectl apply -f k8s/nginx-ingress/mandatory.yaml
```

```
# Apply ingress rules
kubectl apply -f k8s/nginx-ingress/ingress.yaml

# Apply gateway deployment, services and environment files
kubectl apply -f ./k8s/

```

# Configuring the gateway with environment variables
The environment variables can be defined in the `k8s/env.yaml ` or `/src/.env` file.  
*Environment variables defined in the `env.yaml` will override the `.env` file*  

```
...
    spec:
      serviceAccountName: api-gateway
      containers:
        - name: gateway
          image: registry.gitlab.com/isaiahwong/cluster/api/gateway
          imagePullPolicy: IfNotPresent
          ports:
            - name: gateway-port
              containerPort: 5000
          # Edit this portion
          env:
          - name: NODE_ENV
            value: "development"
          - name: MAINTENANCE_MODE
            value: "false"
          - name: SVC_DISCOVERY_INTERVAL
            value: "5000"
          - name: ENABLE_CONSOLE_LOGS_IN_PROD
            value: "false"
          - name: ENABLE_CONSOLE_LOGS_IN_TEST
            value: "true"
...
```

## Environment Variable types

| Variable | Default Value | Description | 
| -------- | ------------- | ----------- | 
| `PORT` | `5000` | Defines which port the `gateway` will run on. <br/> **Note**: *It is not advisable to change the `PORT` when using it with kubernetes. If you have to, do remember to amend the port that binds to the container* |
| `NODE_ENV` | `Development` | Defines if the application is running in production or development. |
| `SVC_DISCOVERY_INTERVAL` | `5000` Milli | How often the gateway will poll Kubernetes [Service Discovery][k8s-svc-discovery] |


# Preparing services to connect with the gateway
```
apiVersion: v1
kind: Service
metadata:
  name: payment-service
  labels:
    resourceType: api-service
  annotations:
    config: '{
      "expose": true,
      "serviceType": "resource",
      "path": "payment",
      "apiVersion": "v1",
      "authentication": {
        "required": "true",
        "exclude": [
          "/api/v1/payment/stripe/webhook/paymentintent",
          "/api/v1/payment/stripe/webhook/test",
          "/api/v1/payment/paypal/webhook/order",
          "/api/v1/payment/paypal/webhook/test"
        ]
      }
    }'
```

# Clean up
```
skaffold delete 

./clean.sh
```

# Directory Layout
```
.
├── /docs/                      # Documentation for the gateway
│
├── /k8s/                       # Development Kubernetes manifest files    
│   ├── /api/                   # Api Services k8s
│   ├── /nginx-ingress/         # Kubernetes ingress config files
│   ├── gateway.yaml            # Gateway deployment and service
│   ├── env.yaml                # Gateway env variables
│   └── ...                     # Other config files 
│
├── /locales/                   # locales configs
│   ├── /en/                    # English locales
│
├── /proto/                     # Protocol Buffers Descriptions (Services)
│
├── /release/                   # Production Kubernetes manifest files    
│   ├── /api/                   # Api Services k8s
│   ├── /nginx-ingress/         # Kubernetes ingress config files
│   ├── gateway.yaml            # Gateway deployment and service
│   ├── env.yaml                # Gateway env variables
│   └── ...                     # Other config files 
│
├── /test/                      # Test files (WIP)
│
├── /src/                       # Api Gateway source code
│
├── clean.sh                    #  Clean dangling images
│
└── skaffold.yaml               #  Skaffold config for development
```

Running without Kubernetes i.e `npm run dev`  
Rename `/src/.env.example` to `/src/.env`
```
# Main
NODE_ENV=development

# K8S
SVC_DISCOVERY_INTERVAL=5000

# Config
MAINTENANCE_MODE=false

ENABLE_CONSOLE_LOGS_IN_PROD=false
ENABLE_CONSOLE_LOGS_IN_TEST=true
```

[Isaiah]: https://www.iisaiah.com
[brew]: https://brew.sh/
[minikube]: https://github.com/kubernetes/minikube/releases/  
[vbox]: https://www.virtualbox.org/wiki/Downloads
[redux]: https://redux.js.org/introduction

[node]: https://nodejs.org
[skaffold]: https://github.com/GoogleContainerTools/skaffold
[mailer]: https://nodemailer.com/

[godaddy-client]: https://github.com/godaddy/kubernetes-client
[ingress-nginx]: https://github.com/kubernetes/ingress-nginx
[kubectl]: https://kubernetes.io/docs/tasks/tools/install-kubectl/
[docker-desktop]: https://www.docker.com/products/docker-desktop
[k8s-service]: https://kubernetes.io/docs/concepts/services-networking/service/
[k8s]: https://github.com/kubernetes/kubernetes
[k8s-svc-discovery]: https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/
