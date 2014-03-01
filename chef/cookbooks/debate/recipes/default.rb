#
# Cookbook Name:: debate
# Recipe:: default
#
# Copyright 2014, ShallWeDebate.com
#
# All rights reserved - Do Not Redistribute
#

package("default-jdk")

system( "cd /vagrant; play compile stage" )
FileUtils.copy '/vagrant/chef/cookbooks/debate/play.conf', '/etc/init/play.conf'