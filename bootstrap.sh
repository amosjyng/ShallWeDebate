#!/usr/bin/env bash

apt-get update
apt-get install -y apache2
rm -rf /var/www
ln -fs /vagrant /var/www

# because of http://askubuntu.com/a/256018
echo "ServerName localhost" | tee /etc/apache2/conf.d/fqdn