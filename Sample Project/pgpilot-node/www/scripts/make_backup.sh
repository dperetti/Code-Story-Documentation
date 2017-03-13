#!/bin/bash

set -e
set -u

gosu postgres pg_dumpall -x -c -v > /backups/"$1".csql