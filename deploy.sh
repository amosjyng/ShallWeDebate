#!/bin/bash
killall java
sudo rm /home/ec2-user/ShallWeDebate/nohup.out
play clean compile stage
sudo -E nohup /home/ec2-user/ShallWeDebate/target/universal/stage/bin/shallwedebate -Dhttp.port=80 &
sleep 5 # wait for nohup command to run
sudo cat /home/ec2-user/ShallWeDebate/nohup.out
