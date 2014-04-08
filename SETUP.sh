PLAY_VERSION="2.2.2"

# set up general stuff
apt-get update
apt-get install -y default-jdk dos2unix unzip postgresql-client-9.1 postgresql-9.1 jsdoc-toolkit make

# set up Postgres
sudo -u postgres psql postgres -c "alter user postgres with password 'dev_password';"
sudo -u postgres createdb debate

# set up Play framework
sudo -u vagrant wget -O /home/vagrant/play.zip http://downloads.typesafe.com/play/${PLAY_VERSION}/play-${PLAY_VERSION}.zip
sudo -u vagrant unzip /home/vagrant/play.zip -d /home/vagrant
rm /home/vagrant/play.zip
echo "export PLAY_VERSION=\"${PLAY_VERSION}\"" >> /home/vagrant/.bashrc
PATH=$PATH:/home/vagrant/play-${PLAY_VERSION}
echo "export PATH=$PATH" >> /home/vagrant/.bashrc
dos2unix -n /vagrant/play.conf /etc/init/play.conf