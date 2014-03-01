ShallWeDebate
=============

This is the source code of an [open source website](http://www.shallwedebate.com/) designed to facilitate debate

Setup
-----

For first-time set up:

1. Run `git submodule init`
2. Run `git submodule update`
2. Install [Vagrant](http://www.vagrantup.com/downloads.html)
2. Run `vagrant up --provision`
6. Go to [127.0.0.1:8080/mockup.html](http://127.0.0.1:8080/mockup.html).

To re-provision the Vagrant machine after pulling new changes, run `vagrant provision`.

Note that the project directory on your host computer is linked to the `/vagrant/` directory of the Vagrant virtual machine.

Documentation
-------------

SSH into the Vagrant machine using `vagrant ssh`, go to the project directory using `cd /vagrant/`, and run `make documentation`. You should now be able to open the newly created `js/doc/index.html` file inside your project directory.
