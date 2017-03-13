#!/bin/sh
#9yf7b#
gosu postgres postgres --single -jE <<-EOSQL
	CREATE ROLE "replication" REPLICATION
EOSQL
