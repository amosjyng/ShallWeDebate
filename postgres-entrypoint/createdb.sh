#!/bin/bash


gosu postgres postgres --single -jE <<-EOSQL
    CREATE DATABASE "debate" WITH OWNER="$POSTGRES_USER";
EOSQL

