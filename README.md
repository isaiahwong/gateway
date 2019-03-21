# Stack
The Cluster is infrastructured with the microservices architecture. Each services are containerised using [Docker][docker] and orchestrated with [Kubernetes][k8s]. The infrastructure models itself with the core principles of microservices; decoupling the technology stack allowing each services to grow independetly. 

# Table of Contents
* [Getting Started](#getting-started)
* [Gateway](#gateway)
* [Directory Layout](#Directory-Layout)
* [Technology Stack](#technology-stack)

# Getting Started
Starting a local version of the cluster on your development machine. 

See the detailed [Getting Started Guide](./docs/getting-started.md)

## Quickstart
```
chmod +x ./scripts/dev/build.sh
./scripts/dev/build.sh

chmod +x ./scripts/dev/run.sh
./scripts/dev/run.sh
```

### Running with [Skaffold][skaffold]
```
skaffold dev
```

# Gateway
The gateway is the entry point for api services. Gateway depends on Kubernetes's [Service Discovery][k8s-svc-discovery]. 

Read more on the Gateway [Documentation](./gateway/README.md)

# Directory Layout
```
.
├── /gateway/                   # Api Gateway source code
│
├── /docs/                      # Documentation for the cluster
│
├── /k8s/                       # Kubernetes config files    
│   ├── /api/                   # Api Services k8s
│   ├── /nginx-ingress/         # Kubernetes ingress config files
│   ├── gateway.yaml            # Kubernetes gateway deployment | service config file
│   └── ...                     # Other config files 
│ 
├── /scripts/                   # Kubernetes config files    
│   ├── /dev/                   # Api Services k8s
│   │   ├── build.sh            # Script for running local cluster
│   │   ├── clean.sh            # Clean dangling images
│   └── 
│
└── skaffold.yaml               #  Skaffold config for development
```

# Technology Stack
* [Node.js][node], [Kubernetes][k8s] — core platform and dev tools
* [Express][express] etc. — common HTTP-server features


## TODO
- [ ] Pipeline for deployment of cluster to production 

## Road Map
- [ ] Implement a service mesh infra — Istio or consul

[Isaiah]: https://www.iisaiah.com
[brew]: https://brew.sh/
[minikube]: https://github.com/kubernetes/minikube/releases/  
[vbox]: https://www.virtualbox.org/wiki/Downloads
[redux]: https://redux.js.org/introduction

[node]: https://nodejs.org
[express]: http://expressjs.com/

[skaffold]: https://github.com/GoogleContainerTools/skaffold
[mailer]: https://nodemailer.com/

[k8s]: https://github.com/kubernetes/kubernetes
[k8s-svc-discovery]: https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/