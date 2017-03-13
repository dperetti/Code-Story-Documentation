
/**
 * @module Controller
 */


Controller = function () {

    var init = function () {

    };

    /** @const */
    var ANALYZE_TOKEN = "ANALYZE: ";

    /**
     *
     * @param data_json
     * @returns {[Object]}
     * @private
     */
    var _parseJSONSQL = function (data_json) {
        var data = JSON.parse(data_json);
        return _.map(data['results'], function (r) {
            return _.object(data['names'], r)
        })
    };

    /**
     *
     * @param node_id
     * @param {string} data
     * @private
     */
    var _analyze = function (node_id, data) {


        /**
         * Callback with either the text or the array of SQL results
         * @callback Controller~applyCallback
         * @param {string|[Object]} parsed - Remaining string
         */

        /**
         * Checks for an analyze hint and parses data, which is either
         * text or JSON encoded SQL results.
         *
         * @param {string} str - String to parse.
         * @param {string} hint - Hint to search for.
         * @param {string} [type=text] - Type of parsing ('text' or 'sql')
         * @param {Controller~applyCallback} apply
         * @returns {bool}
         * @private
         */

        var _checkAnalyzeHint = function(str, hint, type, apply) {

            var search = hint + '='

            if ( str.startsWith(search) ) {
                if (!type) {
                    type = "text"
                }
                var remain = str.substr(search.length);

                if (type == "sql") {
                    var results = _parseJSONSQL(remain)
                    apply(results);
                } else
                if (type == "json") {
                    var data = JSON.parse(remain);
                    apply(data);
                }
                else {
                    apply(remain);
                }
                return true
            }
            return false
        }

        // special messages to be interpreted here start with "ANALYZE:"
        if (data.contains(ANALYZE_TOKEN)) { // #4lK4k#

            var command = data.substr(ANALYZE_TOKEN.length);

            Logs.insertAnalyze(node_id, command);

            // state=
            _checkAnalyzeHint(command, 'state', 'text', function(state) {
                Nodes.update(node_id, {$set: {state: state}})

                if (state == "NOT_A_DB_CLUSTER") {
                    Nodes.update(node_id, {$set: {master: false, slots: [], roles: [], replications: []}})
                }
            });

            // disk_usage=
            _checkAnalyzeHint(command, 'disk_usage', 'text', function(disk_usage) {
                Nodes.update(node_id, {$set: {disk_usage: disk_usage}})
            });

            // free_space=
            _checkAnalyzeHint(command, 'free_space', 'text', function(free_space) {
                Nodes.update(node_id, {$set: {free_space: free_space}})
            });

            // slots=
            _checkAnalyzeHint(command, 'slots', 'sql', function(slots) {
                Nodes.update(node_id, {$set: {slots: slots}})
            })

            // roles=
            _checkAnalyzeHint(command, 'roles', 'sql', function(roles) {
                Nodes.update(node_id, {$set: {roles: roles}})
            });

            // replications=
            _checkAnalyzeHint(command, 'replications', 'sql', function(replications) {
                Nodes.update(node_id, {$set: {replications: replications}})
            })
            //
            //// tables=
            //_checkAnalyzeHint(command, 'tables', 'sql', function(tables) {
            //    Nodes.update(node_id, {$set: {tables: tables}})
            //})

            //// databases=
            //_checkAnalyzeHint(command, 'databases', 'sql', function(databases) {
            //    Nodes.update(node_id, {$set: {databases: databases}})
            //})

            // databases=
            _checkAnalyzeHint(command, 'databases', 'json', function(databases) {
                Nodes.update(node_id, {$set: {databases: databases}})
            })

            // settings=
            _checkAnalyzeHint(command, 'settings', 'sql', function(settings) {
                //console.log(settings)
                Nodes.update(node_id, {$set: {settings: settings}})
            })

            // primary_slot_name=
            _checkAnalyzeHint(command, 'primary_slot_name', 'text', function(slot) {
                if (slot=="-1") {
                    Nodes.update(node_id, {$set: {slave_of: null}})
                } else {
                    var primary = Nodes.findOne({slots: {$elemMatch: {slot_name: slot}}});
                    if ( primary ) {
                        Nodes.update(node_id, {$set: {slave_of: primary._id}})
                    }
                }
            })

            //replication_credentials=
            _checkAnalyzeHint(command, 'replication_credentials', 'text', function(credentials) {
                credentials = credentials.split(':');
                Nodes.update(node_id, {$set: {replication_user: credentials[0], replication_password: credentials[1]}});
                console.log("node updated with replication credentials");
            })
        }
        // test for a progress report. Ex: " 36677/36677 kB (100%), 1/1 tablespace"
        var test = data.match(/\((.+)%\)/);
        if ( test ) {
            var p = test[1]; // 0 <= p <= 100
            Nodes.update(node_id, {$set: {progress: Number(p)}});
        }

    };

    var _canStart = true
    var _delayedUpdates = []
    var _commandsCallbacks = {}

    /**
     * Send a command to server
     * @param {Object} node
     * @param {(string|string[])} msg
     * @callback {function} completion - To be executed when the command has completed.
     */
    var sendCommand = function (node, msg, completion) { // #K3zmV#

        // Prepare the log that will be associated to the command.
      	// MongoDB returns the id of the created Log "document".
      	var command_id = Logs.create(node, msg)

        if (_.isArray(msg)) {
            msg = msg.join(" ")
        }

      	// The command will propably trigger the emission by the server of one or more messages.
      	// At the end (it is marked by the node server), the completion callback will be called.
        if (completion) {
            _commandsCallbacks[command_id] = completion
        }

      	// Websocket string message of the form "<command_id>|<message>"
        Comm.sendMessageToNode(node, command_id + '|' + msg)
    };

    /**
     * Parse a message coming from node (through websocket)
     * @param {Object} node
     * @param {string} node._id
     * @param {string} data
     * @param [flags] unused
     */
    var parseMessage = function (node, data, flags) {

        var tag = data.split('|', 1)[0]
        var txt = data.substr(tag.length + 2)

        var isError = (data.substr(tag.length + 1, 1) == '!')
        var isCommand = (data.substr(tag.length + 1, 1) == '>')

        // "<" indicates the end of the command (see write_end method in actions.py)
        // A result string can optionally be appended. The callback must then handle it.
        if (data.substr(tag.length + 1, 1) == '<') {

            var result = data.substr(tag.length + 2)

            var callback = _commandsCallbacks[tag]
            if (callback) {
                delete _commandsCallbacks[tag]
                if (result) {
                    callback(result);
                } else
                    callback();
            }
            return
        }

        // trick to avoid race condition when updating Commands's line subarray resulting in out of order
        var _processUpdates = function () {
            _canStart = false
            var nextCommand = _delayedUpdates.shift()
            if (nextCommand) nextCommand()
            _canStart = true
        };

        var _updateLines = function () {
            Logs.update(tag, {$push: {lines: {txt: txt, isError: isError, isCommand: isCommand}}}, {}, function () {
                _processUpdates()
            })
        };

        _delayedUpdates.push(_updateLines)

        if (_canStart) {
            _processUpdates()
        }

        // analyze the message
        _analyze(node._id, data);
    };

    return {
        init: init,
        sendCommand: sendCommand,
        parseMessage: parseMessage
    };
}();

Controller.init();
