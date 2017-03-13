#!/bin/bash

set -e # stop and exit in case of error
set -u # stop and exit if a variable is not defined

PRIMARY_HOST=$1
PRIMARY_PORT=$2
REPLICATION_USER=$3
REPLICATION_PASSWORD=$4
REPLICATION_SLOT=$5
PGDATA=$6

# Define the PGPASSFILE. #56jqW#
echo "$PRIMARY_HOST:$PRIMARY_PORT:replication:$REPLICATION_USER:$REPLICATION_PASSWORD" > /pgpass
chmod 0600 /pgpass
export PGPASSFILE=/pgpass

echo "Creating base backup"

#mkdir -p "$PGDATA"
#chown -RL postgres:postgres "$PGDATA"
#chmod 0700 "$PGDATA"

# We can't use gosu here because pgpass is then ignored...#rvfKn#
pg_basebackup -h $PRIMARY_HOST -p $PRIMARY_PORT -U "$REPLICATION_USER" --no-password --xlog-method=stream -D "$PGDATA" --progress
# ...so we chown afterwards instead
chown -RL postgres:postgres "$PGDATA"
chmod 0700 "$PGDATA"


# postgresql.conf

# Enable read-only queries on the standby server
{ echo ""; } >> "$PGDATA"/postgresql.conf
{ echo "hot_standby = on"; } >> "$PGDATA"/postgresql.conf

# recovery.conf
{ echo "standby_mode = 'on'"; } > "$PGDATA"/recovery.conf
{ echo "primary_conninfo = 'host=$PRIMARY_HOST port=$PRIMARY_PORT user=$REPLICATION_USER password=$REPLICATION_PASSWORD'"; } >> "$PGDATA"/recovery.conf
{ echo "primary_slot_name = '$REPLICATION_SLOT'"; } >> "$PGDATA"/recovery.conf
#
## Launch postgres
#exec gosu postgres postgresp
