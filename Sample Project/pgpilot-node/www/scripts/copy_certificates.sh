#!/bin/bash
#
# This script copies the certificates from /certs to the postgresql data folder in
# order to be able to connect remotely to the database through SSL.
#
# The certificates in /certs were either placed there manually by the user
# or created automatically and self-signed by the Dockerfile.
#

set -e
set -u

#lJafF#
cp -f /certs/server.crt /var/lib/postgresql/data
cp -f /certs/server.key /var/lib/postgresql/data

chown postgres:postgres /var/lib/postgresql/data/server.crt
chown postgres:postgres /var/lib/postgresql/data/server.key
