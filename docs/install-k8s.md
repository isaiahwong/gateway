# Running Kubernetes Locally
To run **kubernetes** locally, you require **kubernetes** cli **kubectl** as well as **minikube** coupled with a Hypervisor — VirtualBox. 
* **VirtualBox** — VM that will run kubernetes 
* **minikube** — Minikube is a tool that makes it easy to run Kubernetes locally.
* **kubectl** — Cli that communicates with Kubernetes Cluster

**Note it is recommended to install [Docker][docker] for local development.**

## Installation of Virtualbox
Download and install [VirtualBox][vbox] for macOs or OS X. Open the `.DMG` file

## Installation of minikube
### Using [Homebrew][brew]
```
brew cask install minikube
```

### Install it by downloading the binary
```
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64 \
  && chmod +x minikube
```

### Add minikube executable to your path:
```
sudo mv minikube /usr/local/bin
```

## Installation of Kubectl
### Using [Homebrew][brew]
```
brew install kubernetes-cli
```

### Install it by downloading the binary: 
```
curl -LO https://storage.googleapis.com/kubernetes-release/release/latest/bin/darwin/amd64/kubectl \
  && chmod +x ./kubectl
```

### Add minikube executable to your path:
```
sudo mv ./kubectl /usr/local/bin/kubectl
```

## Starting minikube
```
minikube start
```

## Head back to continue to getting started tutorial
[Getting Started](./getting-started.md)

[brew]: https://brew.sh/
[minikube]: https://github.com/kubernetes/minikube/releases/  
[vbox]: https://www.virtualbox.org/wiki/Downloads