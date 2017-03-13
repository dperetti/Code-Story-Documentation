#!/bin/bash

set -e
set -u

gosu postgres psql  -f /backups/"$1"