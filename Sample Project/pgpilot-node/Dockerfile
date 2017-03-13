# Extends https://github.com/docker-library/postgres/blob/c9d9f4c1a0d33a161fefda666f041ef0dc4dc9f8/9.4/Dockerfile
#yehjg#
FROM postgres:9.4.5

RUN apt-get update && apt-get install -y postgresql-server-dev-9.4 curl build-essential python-pip python-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#Dfukz#
RUN pip install tornado
RUN pip install jinja2
RUN pip install psycopg2
RUN pip install pycrypto

RUN mkdir /www
COPY www /www

#DVsJW#
RUN mkdir /certs
RUN mkdir /backups

COPY ./docker/entrypoint.sh /

ENV PGPASSFILE="/pgpass"

WORKDIR /www
EXPOSE 8888

#R5zeP#
CMD python server.py
#haQCF#
ENTRYPOINT ["/entrypoint.sh"]
