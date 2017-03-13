#!/bin/bash
set -e

if ! [ -z "/certs/server.crt" ]; then #raSh9#
	openssl genrsa -out /certs/server.key 1024 && \
	openssl req  -new -newkey rsa:4096 -days 36500 -nodes -subj "/C=/ST=/L=/O=/CN=`hostname`" -keyout /certs/server.key -out /certs/server.csr  && \
	openssl x509 -req -days 36500 -in /certs/server.csr -signkey /certs/server.key -out /certs/server.crt
	chown postgres:postgres /certs/server.*
	chmod 600 /certs/server.*
fi

exec "$@"
