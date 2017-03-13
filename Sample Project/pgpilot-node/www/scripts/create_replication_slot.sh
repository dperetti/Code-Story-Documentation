#!/bin/sh
#jKQQ6#
gosu postgres postgres --single -jE <<-EOSQL
	SELECT * FROM pg_create_physical_replication_slot('$1');
EOSQL
