#!/bin/sh
gosu postgres postgres --single -jE <<-EOSQL
	ALTER USER postgres SUPERUSER LOGIN ENCRYPTED PASSWORD '$1';
EOSQL
