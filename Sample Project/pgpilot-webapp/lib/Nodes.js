/**
 * Nodes collection. Represent pgwebsocket server nodes.
 * @type {Mongo.Collection}
 */
Nodes = new Meteor.Collection('nodes');

/**
 * Create a node in the database
 * @param {string} host
 * @param {string} password
 * @param {bool} check_server_cert
 * @param {string} server_cert
 * @param {number} websocket_port
 * @param {number} postgres_port
 * @returns {any}
 */
Nodes.createNode = function(name, host, password, check_server_cert, server_cert, websocket_port, postgres_port) { // #KHERt#
    return Nodes.insert({
        name: name,
        host: host,
        password: password,
        check_server_cert: check_server_cert,
        server_cert: server_cert,
        websocket_port: websocket_port,
        postgres_port: postgres_port
    });
};

Nodes.setConnectionEstablished = function(node, connected) { // #JByg8#

    Nodes.update(node._id, {$set: {connected: connected, state: ''}});

    if (connected) {
        Controller.sendCommand(node, "status") // #tDgsV#
    } else {

    }
}

if ( Meteor.isServer ) {

    // https://atmospherejs.com/matb33/collection-hooks

    // When a new node is added, attempt to establish a socket
    Nodes.after.insert(function (userId, node) { // #gSksW#
        try {
            Comm.createSocket(node)
        } catch (e) {
            console.log(e)
        }
    });

    Nodes.after.remove(function (userId, node) {
        try {
            Comm.closeSocket(node)

        } catch (e) {
            console.log(e)
        }
    });

    Nodes.before.update(function (userId, node, fieldNames, modifier, options) {
        try {
            if (fieldNames.indexOf('host') != -1 || fieldNames.indexOf('websocket_port') != -1) {
                Comm.closeSocket(node)
            }

        } catch (e) {
            console.log(e)
        }
    });

    Nodes.after.update(function (userId, node, fieldNames, modifier, options) {
        try {
            if (fieldNames.indexOf('host') != -1 || fieldNames.indexOf('websocket_port') != -1) {

                Comm.createSocket(node)
            }
        } catch (e) {
            console.log(e)
        }
    });
}
