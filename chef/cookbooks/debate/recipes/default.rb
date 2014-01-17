#
# Cookbook Name:: debate
# Recipe:: default
#
# Copyright 2014, ShallWeDebate.com
#
# All rights reserved - Do Not Redistribute
#

package("default-jdk")

FileUtils.copy '/vagrant/chef/cookbooks/debate/play.conf', '/etc/init/play.conf'