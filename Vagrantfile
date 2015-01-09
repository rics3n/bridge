# -*- mode: ruby -*-
# vi: set ft=ruby :

$script = <<SCRIPT
export LANGUAGE=en_US.UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
locale-gen en_US.UTF-8
dpkg-reconfigure locales

grep -q -F 'include "ADMIN_NAME=admin' /etc/environment || echo 'ADMIN_NAME=admin' >> /etc/environment
grep -q -F 'include "ADMIN_PASSWORD=passw0rd' /etc/environment || echo 'ADMIN_PASSWORD=passw0rd' >> /etc/environment
grep -q -F 'include "DOCKER_UNIX_SOCKET_PATH=/var/run/docker.sock' /etc/environment || echo 'DOCKER_UNIX_SOCKET_PATH=/var/run/docker.sock' >> /etc/environment

curl -sL https://deb.nodesource.com/setup | sudo bash -
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
apt-get update && apt-get install -y build-essential curl git nodejs mongodb-org --no-install-recommends && rm -rf /var/lib/apt/lists/*

SCRIPT


# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "ubuntu/trusty64"

  # Must use NFS for this otherwise rails
  # performance will be awful
  config.vm.synced_folder ".", "/vagrant"

  config.vm.network "forwarded_port", guest: 8080, host: 8080

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network "private_network", ip: "192.168.33.10"

  # Install latest docker
  config.vm.provision "docker"

  config.vm.provision "shell", inline: $script

  config.vm.provider "virtualbox" do |vb|
    vb.memory = 2048
    vb.cpus = 2
  end
end
