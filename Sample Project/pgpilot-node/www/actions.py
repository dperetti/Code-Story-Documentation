import json
import os
import re

from command import Command, PGDATA
import threading


class RunCommand(Command):

    _status = None

    def run(self): #7Lytt#
        # Simple commands without parameters
        simple_commands = dict(
            list=self.cmd_list,
            status=self.cmd_status, #Qs5th#
            start=self.cmd_start_postgres,
            stop=self.cmd_stop_postgres,
            promote_to_master=self.cmd_promote_to_master,
            bench=self.cmd_bench,
            settings=self.cmd_settings,
            backups=self.cmd_backups,
            erase=self.cmd_erase,
            get_roles=self.cmd_get_roles,
            get_replication_password=self.cmd_get_replication_password
        )

        # run simple command if found
        simple_commands.get(self.command, lambda: None)()

        # Commands with parameters
        #

        # change_postgres_password
        self.test_regex("change_postgres_password (?P<password>.+)",
                        self.cmd_change_postgres_password)

        # init_primary #uT7lz#
        self.test_regex("init_primary (?P<postgres_password>.+)",
                        self.cmd_init_primary)

        # create_replication_slot
        self.test_regex("create_replication_slot (?P<slot_name>.+) (?P<replication_user>.+) (?P<replication_password>.+)",
                        self.cmd_create_replication_slot)

        # drop_replication_slot
        self.test_regex("drop_replication_slot (?P<slot_name>.+)",
                        self.cmd_drop_replication_slot)

        # init_slave
        self.test_regex("init_slave (?P<ip>.+) (?P<port>.+) (?P<replication_slot>.+) (?P<replication_user>.+) (?P<replication_password>.+)",
                        self.cmd_init_slave)

        # make backup
        self.test_regex("make_backup (?P<name>.+)",
                        self.cmd_make_backup)

        # restore backup
        self.test_regex("restore_backup (?P<name>.+)",
                        self.cmd_restore_backup)

        # delete backup
        self.test_regex("delete_backup (?P<name>.+)",
                        self.cmd_delete_backup)


    def test_regex(self, expr, func):
        re_test = re.match(expr, self.command)
        if re_test:
            d = re_test.groupdict()
            func(**d)  # run the command using found parameters

    def cmd_status(self): #rwR9e#
        self.execute(('disk_usage', 'du -ksh %s' % PGDATA), #fARFV#
                     ('free_space', 'df --sync -mhT %s' % PGDATA),
                    )

        if os.path.exists('/status_backup'):
            self.write_analyse('state=CREATING_SLAVE')
        else:
            self.execute(('status', 'gosu postgres pg_ctl status'))

        self.sql_all("SELECT slot_name, active FROM pg_replication_slots", analyze="slots")
        self.sql_all("SELECT * FROM pg_roles", analyze="roles")
        self.sql_all("SELECT usename, application_name, client_addr, client_port, sync_state, state FROM pg_stat_replication", analyze="replications")
        out = self.sql_all("SELECT datname as name FROM pg_database WHERE datistemplate = false")
        out_databases = []
        if out:
            databases = out['results']
            for database in databases:
                database_name = database[0]
                tables = self.sql_all("""SELECT
                                  relname as name, reltuples as count
                                FROM pg_class C
                                LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
                                WHERE
                                  nspname NOT IN ('pg_catalog', 'information_schema') AND relkind='r'
                                ORDER BY reltuples DESC;""", analyze="tables", database=database_name)
                out_databases.append(dict(name=database_name, tables=tables['results']))
            self.write_analyse('databases='+json.dumps(out_databases))

        try:
            with open(PGDATA + 'recovery.conf', 'r') as f:
                recovery_conf = f.read()
                slot = re.search("primary_slot_name = '(.+)'", recovery_conf).group(1)
                self.write_analyse('primary_slot_name='+slot)
        except:
            self.write_analyse('primary_slot_name=-1')

        self.write_end()

    def cmd_get_roles(self):
        self.sql_all("SELECT * FROM pg_roles", analyze="roles")
        self.write_end()

    def cmd_start_postgres(self):
        if os.path.exists('/status_backup'):  # just to make sure
            self.execute('rm /status_backup')

        self.execute('gosu postgres pg_ctl start -l /dev/null -w')
        self.write_end()

    def cmd_stop_postgres(self):
        self.execute('gosu postgres pg_ctl stop')
        self.write_end()

    def cmd_promote_to_master(self):
        self.execute('gosu postgres pg_ctl promote')
        self.write_end()

    def cmd_list(self):
        self.execute("df")
        self.write_end()

    def cmd_bench(self):

        def bench():
            self.execute('gosu postgres createdb pgtoolboxbench',
                         'gosu postgres pgbench -i -s 20 pgtoolboxbench',
            )
            self.write_end()

        threading.Thread(target=bench).start()


    def cmd_settings(self):
        self.sql_all("SELECT * FROM pg_settings", analyze="settings")
        self.write_end()

    def cmd_erase(self):
        self.execute('gosu postgres pg_ctl stop', 'rm -rf ' + PGDATA)
        self.write_end()

    def cmd_change_postgres_password(self, password):
        try:
            self.sql("ALTER ROLE postgres with ENCRYPTED PASSWORD '%s'" % password, raise_on_exception=True)
        except:
            self.execute('./scripts/change_postgres_password.sh %s' % password)

    def cmd_make_backup(self, name):
        self.execute('./scripts/make_backup.sh %s' % name)
        self.write_end()

    def cmd_delete_backup(self, name):
        self.execute('rm /backups/%s' % name)
        self.write_end()

    def cmd_backups(self):
        import os, glob
        folder = "/backups"
        files = filter(os.path.isfile, glob.glob(folder+"/*.csql"))
        l = []
        for x in files:
            d = os.path.getmtime(x)
            s = os.path.getsize(x)
            #tuple with file and date and size, add it in a list
            file_tuple = (x[len(folder)+1:], d, s)
            l.append(file_tuple)
        #sort the tuple list by the second element which is the date
        l.sort(key=lambda f: f[1])
        self.write_end(json.dumps(l))

    def cmd_restore_backup(self, name):
        self.execute('./scripts/restore_backup.sh %s' % name)
        self.write_end()

    def cmd_init_primary(self, postgres_password=-1): #njQvz#

        self.execute('chown -RL postgres:postgres /var/lib/postgresql/data',
                 'gosu postgres pg_ctl initdb',
                 'sh ./scripts/create_replication_role.sh',
                 'sh ./scripts/copy_certificates.sh',
        )

        self.configure('postgresql.conf', dict(
            wal_level='hot_standby',
            max_wal_senders=3,
            max_replication_slots=3
        ))

        self.configure('pg_hba.conf', dict(
            #replication_user=replication_user
        ))

        if postgres_password != -1:
            self.cmd_change_postgres_password(postgres_password)

        self.cmd_status()


    def cmd_init_slave(self, ip, port, replication_slot, replication_user, replication_password): #96UPT#

        def init_slave():
            self.execute(
                        # trick to let a concurrent cmd_status() know there is a backup in progress.
                        'touch /status_backup',
                        'sh ./scripts/create_base_backup.sh %s %s %s %s %s %s' % (ip, port, replication_user,
                                                                                   replication_password, replication_slot,
                                                                                   PGDATA),
                        'rm /status_backup',
                        # overwrite the certificates that were copied by the backup because they don't apply to this node
                        'sh ./scripts/copy_certificates.sh'
            )
            # start the database
            self.cmd_start_postgres()
            self.write_end()

        # Run in a separate thread as this is could be a long process and we don't want the websocket server to become unresponive.
        threading.Thread(target=init_slave).start()


    def cmd_create_replication_slot(self, slot_name, replication_user, replication_password): #ptH8j#
        self.sql_all("SELECT * FROM pg_create_physical_replication_slot('%s');" % slot_name)
        if replication_password != '-1':
            self.sql("DROP ROLE %s" % replication_user)
            self.sql("CREATE ROLE %s IN ROLE replication REPLICATION LOGIN ENCRYPTED PASSWORD '%s'" % (replication_user, replication_password))
        self.write_end()

    def cmd_drop_replication_slot(self, slot_name):
        self.sql_all("SELECT pg_drop_replication_slot('%s');" % slot_name)
        # self.sql("DROP ROLE %s" % replication_user)
        self.write_end()

    def cmd_get_replication_password(self):
        with open('/pgpass', 'r') as f:
            pgpass = f.read()
            user, password = pgpass.strip().split(":")[3:5]
        self.write_end(user + ":" + password)

    def analyze(self, hint, out_all, err_all):
        r = None

        if hint == 'disk_usage': #ktRxW#
            if out_all:
                for out in out_all:
                    r = "disk_usage=" + out.split("\t")[0]

        if hint == 'free_space':
            if out_all:
                r = "free_space=" + re.split('\s+', out_all[-1])[4]

        if hint == 'status':
            if err_all:
                err = err_all[-1]
                if err.find('not a database cluster directory') > 0:
                    r = "state=NOT_A_DB_CLUSTER"

            if out_all:
                for out in out_all:
                    if out.find('no server running') > 0:
                        r = "state=NO_SERVER_RUNNING"
                    if out.find('server is running') > 0:
                        r = "state=SERVER_IS_RUNNING"

        if r:
            self.write_analyse(r) #RpdVs#
