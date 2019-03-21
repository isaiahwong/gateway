# /bin/bash
docker build -t registry.gitlab.com/isaiahwong/cluster/api/gateway:latest -t registry.gitlab.com/isaiahwong/cluster/api/gateway:$SHA -f ./api/gateway/Dockerfile ./api/gateway

docker push registry.gitlab.com/isaiahwong/cluster/api/gateway:latest 

docker push registry.gitlab.com/isaiahwong/cluster/api/gateway:$SHA 

kubectl apply -f k8s
kubectl set image deployments/server-deployment server=registry.gitlab.com/isaiahwong/cluster/api/gateway:$SHA