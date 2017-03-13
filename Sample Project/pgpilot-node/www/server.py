import hashlib
from logging import DEBUG
import os
import random
import string
from tornado import websocket
import tornado
from tornado.log import gen_log, logging
from actions import RunCommand


class MainHandler(websocket.WebSocketHandler): #t5bmc#
    salt = None
    challenge_expected_answer = None
    authorized = False
    password = os.environ['pass']

    def on_message(self, message): #uQh4Q#
        # Did we just receive a challenge from the client?
        # Send the back answer to prove we have the same password.
        if message[:10] == 'challenge|':
            challenge = message[10:]
            self.write_message('challenge_answer|' + self._hashed_challenge(challenge))
            return

        # An answer to our challenge was sent by the client.
        # If it matches the expected answer, authentication is OK on our side.
        if message[:17] == 'challenge_answer|': #BmczJ#
            result = message[17:]
            self.authorized = (result == self.challenge_expected_answer)

        if not self.authorized:
            self.close()
            return

        # messages have the form <tag>|<command> where tag is some private identifier for the command.
        sp = message.split('|', 1) #ccNjl#
        if len(sp) == 2:
            tag = sp[0]
            command = sp[1]

            # Run the command
            c = RunCommand(handler=self, tag=tag, command=command)
            c.run()

    def open(self): #j85PP#
        print "WebSocket opened"

        # Create a random challenge.
        challenge = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(256))
        # Mix it and hash it with the password
        self.challenge_expected_answer = self._hashed_challenge(challenge)
        # Send the clear challenge to the client
        self.write_message("challenge|" + challenge)

    def data_received(self, chunk):
        pass  # not used

    def on_close(self):
        print "WebSocket closed"

    def check_origin(self, origin):
        return True

    def _hashed_challenge(self, challenge):
        # "salt" the challenge with the password, return a md5
        md5 = hashlib.md5()
        md5.update(self.password + challenge)
        return md5.hexdigest()


# This handler is commented out but is kept here as an example of how to
# run a command without using any front end. (useful in development)
# class DummyHandler(object):
#     def write_message(self, message):
#         if message[:6] == 'init|<':
#             c = RunCommand(handler=self, tag='start', command="start")
#             c.run()
# Here we're starting the server after having initialized it.
# See also below.

if __name__ == "__main__": #rp5lk#

    # See DummyHandler above.
    # Create a primary postgres database on startup (in dev only)
    # c = RunCommand(handler=DummyHandler(), tag='init', command="init_primary -1")
    # c.run()


    # Set up Tornado logging
    gen_log.setLevel(DEBUG)
    # create formatter and add it to the handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    gen_log.addHandler(ch) # add the handlers to the logger

    # Define a tornado application
    application = tornado.web.Application([
        (r"/pgnode", MainHandler),
    ])

    lib_dir = '/certs'

    # Listen on 0.0.0.0:8888. We'll handle addr & port mapping.
    application.listen(8888, "0.0.0.0", ssl_options=dict(
        certfile=os.path.join(lib_dir, "server.crt"),
        keyfile=os.path.join(lib_dir, "server.key")
    ))
    # "ca_certs": os.path.join(lib_dir, "client.crt"),
    # "cert_reqs": CERT_REQUIRED

    # start the application
    tornado.ioloop.IOLoop.instance().start()
