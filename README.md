ShallWeDebate
=============

This is the source code of an [open source website](http://www.shallwedebate.com/) designed to facilitate debate

Setup
-----

**If developing,** checkout the branch `develop`.

### Environment Variables

Put the following inside `vars.env`:

* `APP_SECRET`
* `DB_USER`
* `POSTGRES_PASSWORD`
* `FB_CLIENT_ID`
* `FB_CLIENT_SECRET`

### Bash

1. Make a symlink from the source folder to `/ShallWeDebate`
2. Install `docker` and `docker-compose`
3. Run the docker daemon `docker -d` and then `sudo docker-compose run --service-ports web activator run` (for development) or `docker-compose up -d` (for production)
4. Go to [127.0.0.1](http://127.0.0.1/)
