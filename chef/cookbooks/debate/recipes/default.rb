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
  play compile stage
  /vagrant/target/start
  EOH
end