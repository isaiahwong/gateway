# /bin/bash
# Remove all unused images not just dangling ones in the vm (minikube)
eval $(minikube docker-env)

# api/gateway
docker rmi $(docker images | grep registry.gitlab.com/isaiahwong/cluster/api/gateway) --force 2>/dev/null 

docker rmi $( docker images | grep '<none>') --force 2>/dev/null 

# Deletes dangling Images
docker system prune -f --all
