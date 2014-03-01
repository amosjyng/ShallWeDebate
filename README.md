ShallWeDebate
=============

This is the source code of an [open source website](http://www.shallwedebate.com/) designed to facilitate debate

Setup
-----

For first-time set up:

1. Run `git submodule init`
2. Run `git submodule update`
3. Install [Vagrant](http://www.vagrantup.com/downloads.html)
4. Run `vagrant plugin install vagrant-triggers; vagrant up --provision`
5. Go to [127.0.0.1:8080](http://127.0.0.1:8080/).

To re-provision the Vagrant machine after pulling new changes, run `vagrant provision`.

Note that the project directory on your host computer is linked to the `/vagrant/` directory of the Vagrant virtual machine.

Documentation
-------------

SSH into the Vagrant machine using `vagrant ssh`, go to the project directory using `cd /vagrant/`, and run `make documentation`. You should now be able to open the newly created `js/doc/index.html` file inside your project directory.
