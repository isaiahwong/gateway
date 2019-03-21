# /bin/bash
# Remove all unused images not just dangling ones in the vm (minikube)
eval $(minikube docker-env)

# api/gateway
docker rmi $(docker images | grep registry.gitlab.com/isaiahwong/cluster/api/gateway) --force

docker rmi $( docker images | grep '<none>') --force

# Deletes dangling Images
docker system prune -f --all
