# bridge

**Bridge is a simple, web based docker manging app based on node.js. It's main goal is to wrap the docker API/CLI into a simple webinteface.** 

Why `bridge` is different from other docker mangement tools.

* **simple** - `bridge` aims to be a convenience wrapper of the docker api for the web
* **single node** - `bridge` is made to manage a single docker daemon, not cluster (this might come in the future)
* **integrated** - `bridge` integrates with services like the docker registry, slack, email etc too 
* **batteries included** - `bridge` targets users that have common docker tasks in ther minds: pull, restart, schedule a docker run etc.

Features include:

* **container management** - pull & run containers with all required parameters like volumes, ports, links etc.
* **scheduler (TBA)** - 
* **security** - single user via HTTTP basic auth. (Note: you should always use SSL for you server. cloudflare offers free ssl!)

# configuration & setup

## interactive mode

```
docker run -it --rm \
  -e DOCKER_HOST=$DOCKER_HOST \
  -e DOCKER_CERT_PATH=/cert \
  -p 8080:8080 \
  -v $DOCKER_CERT_PATH:/cert \
  bridge
```

## daemon mode

```
docker run -d --name hafenbar \
  -e DOCKER_HOST=$DOCKER_HOST \
  -e DOCKER_CERT_PATH=/cert \
  -p 8080:8080 \
  -v $DOCKER_CERT_PATH:/cert \
  bridge
```

# 

