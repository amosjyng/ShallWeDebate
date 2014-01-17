#
# Cookbook Name:: debate
# Recipe:: default
#
# Copyright 2014, ShallWeDebate.com
#
# All rights reserved - Do Not Redistribute
#

package("default-jdk")

bash "Set up and run Play server" do
  user "vagrant"
  code <<-EOH
  cd /vagrant
  play compile stage
  start_script="/vagrant/target/universal/stage/bin/shallwedebate > debate-\$(date +%s).log &"
  if ! grep -Fxq "$start_script" ~/.bashrc
  then
    echo "$start_script" >> ~/.bashrc
  fi
  exit 0
  EOH
end