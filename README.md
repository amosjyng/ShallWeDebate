ShallWeDebate
=============

This is the source code of an [open source website](http://www.shallwedebate.com/) designed to facilitate debate

Setup
-----

1. Install `docker` and `docker-compose`
2. Run the docker daemon `docker -d` and then `docker-compose up`
3. Go to [127.0.0.1:80](http://127.0.0.1:80/)

Environment Variables
---------------------

### For development

* `FB_CLIENT_ID`
* `FB_CLIENT_SECRET`

### For production

All of the development environment variables, as well as

* `DB_URL`
* `DB_ADDRESS`
* `DB_USER`
* `DB_PASSWORD`

Also be sure to change `application.secret` in `conf/application.conf`.