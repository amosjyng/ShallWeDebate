# don't run automatically yet, use this as a guide for AWS setup
# sudo yum install -y rubygems git java-1.7.0-openjdk java-1.7.0-openjdk-devel dos2unix unzip postgresql
# sudo gem install sass
# and then
# git clone git@github.com:amosjyng/ShallWeDebate.git
# 
# should be able to connect to RDS after SSHing into EC2 instance by 
# psql debate -U shallwedebate -h RDS_ENDPOINT -p 5432
PLAY_VERSION="2.2.2"

# set up Play framework
sudo -u ec2-user wget -O /home/ec2-user/play.zip http://downloads.typesafe.com/play/${PLAY_VERSION}/play-${PLAY_VERSION}.zip
sudo -u ec2-user unzip /home/ec2-user/play.zip -d /home/ec2-user
rm /home/ec2-user/play.zip
mv "/home/ec2-user/play-${PLAY_VERSION}" /home/ec2-user/play
echo "export PLAY_VERSION=\"${PLAY_VERSION}\"" >> /home/ec2-user/.bashrc
PATH=$PATH:/home/ec2-user/play
echo "export PATH=$PATH" >> /home/ec2-user/.bashrc
# need to make sure sudo has environment variables first
#dos2unix -n /home/ec2-user/ShallWeDebate/AWS.conf /etc/init/start-play-up.conf

# production setup (use manually -- remember to replace RANDOM_STRING and the_production_database_password)
# echo "export DB_URL=jdbc:postgresql://debate-db-instance.RANDOM_STRING.us-east-1.rds.amazonaws.com/debate" >> /home/ec2-user/.bashrc
# echo "export DB_ADDRESS=debate-db-instance.RANDOM_STRING.us-east-1.rds.amazonaws.com" >> /home/ec2-user/.bashrc
# echo "export DB_USER=shallwedebate" >> /home/ec2-user/.bashrc
# echo "export DB_PASSWORD=the_production_database_password" >> /home/ec2-user/.bashrc
# echo "export FB_CLIENT_ID=APP_ID" >> /home/ec2-user/.bashrc
# echo "export FB_CLIENT_SECRET=APP_SECRET" >> /home/ec2-user/.bashrc
#
# remember to change the application.secret in conf/application.conf

# remove previous running instances
# sudo killall java
# start the website up
# play clean compile stage
# (make sure you put "-E" to preserve environment variables!!!)
# sudo -E nohup /home/ec2-user/ShallWeDebate/target/universal/stage/bin/shallwedebate -Dhttp.port=80 &
