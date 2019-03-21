# Api Gateway
The gateway is the entry point for api services. Gateway depends on Kubernetes's [Service Discovery][k8s-svc-discovery]. 

# Envirable Variables
The environment variables can be defined in the `gateway.yaml ` or `.env` file.  
*Environment variables defined in the `gateway.yaml` will override the `.env` file*  

Example `gateway.yaml` stored in project root `/k8s/gateway.yaml`.
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

Example `.env` stored in the gateway src root `/gateway/src/.env`
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

## Environment Variable types

| Variable | Default Value | Description | 
| -------- | ------------- | ----------- | 
| `PORT` | `5000` | Defines which port the `gateway` will run on. <br/> **Note**: *It is not advisable to change the `PORT` when using it with kubernetes. If you have to, do remember to amend the port that binds to the container* |
| `NODE_ENV` | `Development` | Defines if the application is running in production or development. |
| `SVC_DISCOVERY_INTERVAL` | `5000` Milli | How often the gateway will poll Kubernetes [Service Discovery][k8s-svc-discovery] |

TODO

[Isaiah]: https://www.iisaiah.com
[brew]: https://brew.sh/
[minikube]: https://github.com/kubernetes/minikube/releases/  
[vbox]: https://www.virtualbox.org/wiki/Downloads
[redux]: https://redux.js.org/introduction

[node]: https://nodejs.org
[skaffold]: https://github.com/GoogleContainerTools/skaffold
[mailer]: https://nodemailer.com/

[k8s]: https://github.com/kubernetes/kubernetes
[k8s-svc-discovery]: https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/
