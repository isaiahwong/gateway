# Getting Started
Follow these steps to launch the local microservices cluster on your development computer.

# Contents
* [Installing Kubernetes Locally](#installing-kubenetes-locally)
* [Starting the services](#Starting-the-services)
* [Detailed explaination](#Detailed-Explanation)
* [Installing Skaffold for development](#Installing-Skaffold-for-development-(Recommended))


# Installing Kubenetes locally
Follow the [Install Kubernetes](./install-k8s.md) guide.


# Starting the services

### Run the build script
```
chmod +x ./scripts/dev/build.sh
./scripts/dev/build.sh
```

### Run the run script
```
chmod +x ./scripts/dev/run.sh
./scripts/dev/run.sh
```

### Get the ip of the cluster
```
minikube ip
MINIKUBE_SERVER="https://$(minikube ip)"
```

### Test the api 
```
curl $MINIKUBE_SERVER --insecure
```

### Cleaning up
```
chmod +x ./scripts/dev/clean.sh
./scripts/dev/clean.sh
```

# Detailed Explanation
TODO


# Installing Skaffold for development (Recommended)
Skaffold detects changes in your source code and builds and deploys it.

### Installing via [Homebrew][brew]
```
brew install skaffold
```

### Install it by downloading the binary
```
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-darwin-amd64
chmod +x skaffold
sudo mv skaffold /usr/local/bin
```

### Run 
```
skaffold dev
```

[brew]: https://brew.sh/

