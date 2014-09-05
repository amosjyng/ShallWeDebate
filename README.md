ShallWeDebate
=============

This is the source code of an [open source website](http://www.shallwedebate.com/) designed to facilitate debate

Setup
-----

For first-time set up:

1. Install [Vagrant](http://www.vagrantup.com/downloads.html)
2. Run `vagrant up; vagrant reload`. You may have to wait for 5 minutes after the command appears to have finished, before Step 3 will work (compiling the source code takes quite some time).
3. Go to [127.0.0.1:8080/](http://127.0.0.1:8080/).
4. For authentication setup, change `clientId` and `clientSecret` inside `conf/play.plugins`

To re-provision the Vagrant machine after pulling new changes, run `vagrant provision`.

Note that the project directory on your host computer is linked to the `/vagrant/` directory of the Vagrant virtual machine.
