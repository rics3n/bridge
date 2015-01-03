# bridge

**Bridge is a simple, web based docker manging app based on node.js. It's main goal is to wrap the docker API/CLI into a simple webinterface.** 

![Bridge](http://justinsomnia.org/images/cap-cleveland-bridge-view-moon-lit-big.jpg)


Why `bridge` is different from other docker mangement tools.

* **simple** - `bridge` aims to be a very simple convenience wrapper of the docker api for the web
* **single node** - `bridge` is made to manage a single docker daemon, not cluster (this might come in the future)
* **integrated** - `bridge` integrates with services like the docker registry, slack, email etc too 
* **batteries included** - `bridge` targets users that have common docker tasks in ther minds: pull, restart, schedule a docker run etc.

## Features in development:

* **container management** - pull & run containers with all required parameters like volumes, ports, links etc. this is 
* **security** - single user via HTTTP basic auth. (Note: you should always use SSL for you server. cloudflare offers free ssl!)

## Features that will be included later

* **scheduler** - cronjob like scheduler for running containers.

# configuration & setup

## ENV Variables

* **ADMIN_NAME** - username used for authentication
* **ADMIN_PASSWORD** - password used for authentication

to connect to your docker installation use one of the following combination:

* **DOCKER_HOST** 
* **DOCKER_CERT_PATH** 

or

* **DOCKER_UNIX_SOCKET_PATH** - maybe together with a -v that links the unix socket into the bridge container. (note: you have the set the -H parameter in the docker config at /var/default/docker)

optional parameters:

* **SLACK_URL** - the slack url to be called, if an event is triggered.

# examples

## using certs & external host (eg boot2docker), deamonized

```
docker run -d --name bridge \
  -e ADMIN_NAME=admin \
  -e ADMIN_PASSWORD=4dm1n \
  -e DOCKER_HOST=$DOCKER_HOST \
  -e DOCKER_CERT_PATH=/cert \
  -p 8080:8080 \
  -v $DOCKER_CERT_PATH:/cert \
  magege/bridge
```

## using mounted unix socket 

```
docker run -d --name bridge \
  -e ADMIN_NAME=admin \
  -e ADMIN_PASSWORD=4dm1n \
  -e DOCKER_UNIX_SOCKET_PATH=/var/run/docker.sock \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  magegu/bridge
```

# development

run server with [nodemon](https://github.com/remy/nodemon)

```
nodemon app.js -e js,html
```

build locally:

```
docker build -t magegu/bridge .
```

# based on

* [dockerode](https://github.com/apocas/dockerode) - an awesome docker node.js library
* [express](https://github.com/strongloop/express) - node.js web framework
* lots of other libraries

[container image source](http://justinsomnia.org/2010/09/moonlit-containers/)
