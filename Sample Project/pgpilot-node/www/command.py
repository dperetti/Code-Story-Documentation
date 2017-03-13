import json
import select
import shlex
import subprocess
import psycopg2
from jinja2 import Environment, PackageLoader
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

__author__ = 'dom'

env = Environment(loader=PackageLoader('command'))
PGDATA = '/var/lib/postgresql/data/'

class Command(object):
    tag = None
    command = None
    handler = None

    def __init__(self, handler, tag, command):
        self.handler = handler
        self.tag = tag
        self.command = command

    @staticmethod
    def configure(conf_file_name, params):
        template = env.get_template(conf_file_name + '.jinja2')
        with open(PGDATA + conf_file_name, 'w') as f:
            f.write(template.render(params))

    def execute(self, command, *next_commands): #H2955#
        """ Execute one or multiple commands.

        Keyword arguments:
        command -- A command.
        next_commands -- Semantic trick to pass multiple commands without using a list.
        Each command of the list can be a tuple of the form: (analyze, command)
        """
        try:
            commands = list([command]) + list(next_commands)
            for command in commands:
                out_all = list()
                err_all = list()
                analyse_hint = None
                if type(command) is tuple:
                    analyse_hint, command = command

                self.write_stdout(command, is_command=True)
                args = shlex.split(command)
                p = subprocess.Popen(args, shell=False, universal_newlines=True,
                                        stdout=subprocess.PIPE,
                                        stderr=subprocess.PIPE, bufsize=1, close_fds=True)

                while True:
                    # if subprocess is terminated, we will stop after
                    # we made sure we get the very last bytes from the buffer
                    stop = False
                    if p.poll() is not None:
                        stop = True

                    reads = [p.stdout.fileno(), p.stderr.fileno()]
                    ret = select.select(reads, [], [])

                    for fd in ret[0]:
                        if fd == p.stdout.fileno():
                            out = p.stdout.readline().rstrip()
                            if len(out) > 0:
                                out_all.append(out)
                                self.write_stdout(out)
                        elif fd == p.stderr.fileno():
                            err = p.stderr.readline().rstrip()
                            if len(err) > 0:
                                err_all.append(err)
                                self.write_stderr(err)
                    if stop:
                        break
                if analyse_hint: #2wmLW#
                   self.analyze(analyse_hint, out_all, err_all)
        except Exception, e:
            print e

    def sql_all(self, query, analyze=None, database=None): #CWlWp#
        # write sql query
        self.write_stdout(query, is_command=True)

        result = None
        try:
            conn = psycopg2.connect(user='postgres', database=database)
            cur = conn.cursor()
            cur.execute(query)
            results = cur.fetchall()

            colnames = [desc[0] for desc in cur.description]
            result = dict(names=colnames, results=results)
            out_json = json.dumps(result)
            self.write_stdout(out_json)

            if analyze:
                self.write_analyse(analyze+"="+out_json)

        except Exception, e:
            self.write_stderr(e.message)

        return result

    def sql(self, query, raise_on_exception=False): #AtbNK#
        # write sql query
        self.write_stdout(query, is_command=True)

        result = None
        conn = None
        cur = None
        try:
            conn = psycopg2.connect("user=postgres")
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = conn.cursor()
            cur.execute(query)
            result = cur.fetchone()

        except Exception, e:
            if raise_on_exception:
                raise e
            else:
                self.write_stderr(e.message)

        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

        return result

    def write_stderr(self, stderr):
        self.handler.write_message(self.tag + '|! ' + stderr)

    def write_stdout(self, stdout, is_command=False): #uUNzC#
        c = '>' if is_command else '='
        self.handler.write_message(self.tag + '|' + c + ' ' + stdout)

    def write_end(self, result=''):
        self.handler.write_message(self.tag + '|<' + result)

    def write_analyse(self, r): #S8qsy#
        self.handler.write_message("ANALYZE: " + r)
