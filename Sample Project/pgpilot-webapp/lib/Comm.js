/**
 * @module Comm
 */
import ws from 'ws'

let WebSocket

Comm = function () {

    var connections = {}
    // var Websocket = null
    //var Tunnel = null
    var init = function () {

        if (Meteor.isServer) {
            Websocket = ws
            //Tunnel = Meteor.npmRequire('tunnel-ssh');
        }
    }

    /**
     * Creates nodes from config
     * @param {array} data
     */
    var createNodesFromConfig = function(data) { // #odvgv#
        _.each(data, function(d) {
            Nodes.createNode(d.name, d.host, d.password,
                d.check_server_cert == null ? false : d.check_server_cert, d.server_cert,
                d.websocket_port, d.postgres_port);
        }, this);
    }

    /**
     * Establish connections to nodes
     */
    var connectNodes = function () {

        var all_nodes = Nodes.find({}, {sort: {score: -1, name: 1}});

        Nodes.update({}, {$set: {connected: false}}, {multi: true})

        all_nodes.forEach(function (nd) {
            try {
                createSocket(nd);
            } catch (e) {
            }
        })
    }

    /**
     * Send a message to the node through the websocket
     * @param  {Node} node A Node
     * @param  {string} msg  A message
     */
    var sendMessageToNode = function (node, msg) { // #LaBv3#
        var conn = connections[_node_address(node)];
        conn.send(msg)
    }

    var closeSocket = function (node) {
        delete connections[node.host + ':' + node.websocket_port]
        Nodes.update(node._id, {$set: {connected: false}})
    }

    var _node_address = function (node) {
        return node.host + ':' + node.websocket_port
    }

    /**
     * Try to re-establish a node connection
     * @param node
     */
    var createSocket = function (node) {
        var address = _node_address(node)
        var existing = connections[address];
        var password = node.password;
        var challenge_expected_answser = null;

        if (existing) {
            Nodes.update(node._id, {$set: {connected: true}})
            return;
        }

        //var fs = Meteor.npmRequire('fs')

        var ws = new Websocket('wss://' + address + '/pgnode', { // #EnkC4#
            rejectUnauthorized: node.check_server_cert,
            ca: [node.server_cert],
            //cert: fs.readFileSync(process.env.PWD + '/client.crt'),
            //key: fs.readFileSync(process.env.PWD + '/client.key'),
        });

        ws.on('open', Meteor.bindEnvironment(function () { // #9mcaT#
            connections[address] = ws

            // Create a challenge from the password that the server must fulfill
            var challenge = Random.id(256)
            challenge_expected_answser = CryptoJS.MD5(password + challenge).toString();
            sendMessageToNode(node, 'challenge|' + challenge);
        }));

        ws.on('close', Meteor.bindEnvironment(function () {
            closeSocket(node)
        }));

        ws.on('error', function (e) {
            console.log('Cannot connect to ' + address + " " + e); // TODO: provide error message to the user
        });

        ws.on('message', Meteor.bindEnvironment(function (data, flags) {

                var result;
                // A challenge was received from the server.
                // Fulfill it and send the answer.
                if (data.substr(0, 10) == 'challenge|') { // #bUTUH#
                    var challenge = data.substr(10);
                    result = CryptoJS.MD5(password + challenge).toString();

                    sendMessageToNode(node, 'challenge_answer|' + result);
                    return;
                }

                // An answer to our challenge (sent on 'open') was sent by the server.
                // If it matches the expected answer, authentication is OK on our side.
                else if (data.substr(0, 17) == 'challenge_answer|') { // #V2Szn#
                    result = data.substr(17);

                    if (result == challenge_expected_answser) {
                        Nodes.setConnectionEstablished(node, true);
                        node.connected = true; // this is a bit redundant with the line before,
                        // but we want to be able to check immediately (see right below) if
                     	// the node is connected. The problem with Node.setConnectionEstablished() is
                      	// that the updated node will not be updated right away (asynchronous).
                    }
                }

                if ( !node.connected ) {
                    closeSocket(node);
                }

                // At this point, we know the connection was authenticated before, so let's process the message.
                Controller.parseMessage(node, data, flags);
            })
        );
    }

    return {
        init: init,
        connections: connections,
        createNodesFromConfig: createNodesFromConfig,
        connectNodes: connectNodes,
        createSocket: createSocket,
        closeSocket: closeSocket,
        sendMessageToNode: sendMessageToNode
    };
}();

Comm.init()
