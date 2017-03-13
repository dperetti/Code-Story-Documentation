import launchModal from './../imports/launchModal.jsx'
import NodeEditModal from './../imports/modals/NodeEditModal.jsx'
import CreateMasterModal from './../imports/modals/CreateMasterModal.jsx'
import BackupsModal from './../imports/modals/BackupsModal.jsx'

/**
 * @module PGPilot
 */
export default PGPilot = function() {

    var init = function() {

    };

    /**
     * Connect PGPilot to a node
     * @param {Nodes} node
     */
    var connect = function(node) {
        Meteor.call('reconnect', node);
    };

    /**
     * Refresh all nodes' statuses
     */
    var refresh = function() {
        Meteor.call('cmd_all_statuses');
    };

    /**
     * Create a slave from a master
     * @param {string} node_id
     * @param {string} master_node_id
     */
    var createSlave = function(node_id, master_node_id) { // #bHaxJ#

        var master_node = Nodes.findOne(master_node_id);

        if (confirm("Are you sure you want to make this server a slave of " + master_node.host + " (" + master_node.postgres_port + ") ?")) {
            Meteor.call('action_create_slave', node_id, master_node_id)
        }
    };

    /**
     * Create a master
     * @param {string} node_id
     */
    var createMaster = function(node_id) {
        var node = Nodes.findOne(node_id);
        launchModal(CreateMasterModal, {handleSave: function(state) { // #dUh5t#
            var node_id = node._id;
            var postgres_password = state.postgresUser == "accessible" ? state.password : null;
            Meteor.call('init_primary', node_id, postgres_password); // #PmMVW#
        }});
    };

    /**
     * Start a server
     * @param {string} node_id
     */
    var startServer = function(node_id) {

        var node = Nodes.findOne(node_id);
        Meteor.call('cmd_start', node);
    };

    /**
     * Stop a server
     * @param {string} node_id
     */
    var stopServer = function(node_id) {

        var node = Nodes.findOne(node_id);
        Meteor.call('cmd_stop', node);
    };

    /**
     * Promote a server to master
     * @param {string} node_id
     */
    var promoteToMaster = function(node_id) {

        var node = Nodes.findOne(node_id);
        Meteor.call('cmd_promote_to_master', node);
    };

    /**
     * Drop a replication slot
     * @param {string} node_id
     * @param {string} slot_name
     */
    var dropReplicationSlot = function(node_id, slot_name) {
        var node = Nodes.findOne(node_id);
        if (confirm("Are you sure you want to drop replication slot " + slot_name + " ?")) {
            Meteor.call('cmd_drop_replication_slot', node, slot_name);
        }
    };

    /**
     * Create a node or update the settings of an existing node
     * @param {string} [node_id]
     * @param {Object} settings
     */
    var updateOrCreateSettings = function(node_id, settings) { // #TJ24Q#
        if (node_id == undefined) {
            Nodes.createNode(settings.name, settings.host,
                settings.password,
                settings.check_server_cert, settings.server_cert,
                settings.websocket_port,settings.postgres_port);
        } else
        if (Nodes.findOne({address: settings.host})) {

            alert('Already exists');
            return false;

        } else Nodes.update(node_id, {
            $set: {
                name: settings.name,
                host: settings.host,
                password: settings.password,
                server_cert: settings.server_cert,
                check_server_cert: settings.check_server_cert,
                websocket_port: settings.websocket_port,
                postgres_port: settings.postgres_port
            }
        });

    };

    var uiSaveConfiguration = function() {
        Meteor.call('saveConfiguration');
    };

    /**
     * Open a modal to create or edit the node's settings
     * @param [node_id]
     */
    var uiEditSettings = function(node_id) { // #EKEee#
        var model = Nodes.findOne(node_id);
        launchModal(NodeEditModal, {
            model: model,
            handleSave: function (state) {
                PGPilot.updateOrCreateSettings(node_id, state);
            }
        });
    };

    /**
     * Ask confirmation then deletes a node
     * @param node_id
     */
    var uiDeleteNode = function(node_id) {

        if (confirm("Delete this node ?")) {
            Nodes.remove(node_id)
        }
    };

    /**
     * Prompt for a password then set it
     * @param node_id
     */
    var uiChangePostgresPassword = function(node_id) {
        //var newPassword = prompt("Set password for postgres user");
        //if (newPassword != null) {
        //    Meteor.call('cmd_change_postgres_password', node_id, newPassword);
        //}
        var node = Nodes.findOne(node_id);

        launchModal(CreateMasterModal, {title: "Change postgres password", handleSave: function(state) {
            var node_id = node._id;
            var postgres_password = state.postgresUser == "accessible" ? state.password : null;
            Meteor.call('cmd_change_postgres_password', node_id, postgres_password);
        }});

    };

    /**
     * Open the backups modal panel
     * @param node_id
     */
    var uiOpenBackups = function(node_id) {
        var node = Nodes.findOne(node_id);
        Meteor.call('cmd_get_backups', node, function(error, result) {

            launchModal(BackupsModal,
                {
                    node: node
                });
        });
    };

    /**
     * Open a the new backup modal panel
     * @param node_id
     */
    var uiMakeBackup = function(node_id) {
        var node = Nodes.findOne(node_id);

        var name = prompt("Backup name", moment().format('YYYY-MM-DD-T-HHMMSS'));
        if ( name != undefined ) {
            Meteor.call('cmd_make_backup', node, name)
        }
    };

    /**
     * Erase all data on node
     * @param node_id
     */
    var uiEraseData= function(node_id) {
        var node = Nodes.findOne(node_id);
        if (confirm("ERASE PGDATA on this node?")) {
            Meteor.call('cmd_erase_node', node);
        }
    };

    /**
     * Run benchmarks on node
     * @param node_id
     */
    var uiBenchmark= function(node_id) {
        var node = Nodes.findOne(node_id);
        if (confirm("Run benchmarks on this node?")) {
            Meteor.call('cmd_benchmark', node);
        }
    };



    return {
        init: init,
        connect: connect,
        createSlave: createSlave,
        createMaster: createMaster,
        refresh: refresh,
        startServer: startServer,
        stopServer: stopServer,
        promoteToMaster: promoteToMaster,
        dropReplicationSlot: dropReplicationSlot,
        uiSaveConfiguration: uiSaveConfiguration,
        uiEditSettings: uiEditSettings,
        uiDeleteNode: uiDeleteNode,
        updateOrCreateSettings: updateOrCreateSettings,
        uiChangePostgresPassword: uiChangePostgresPassword,
        uiOpenBackups: uiOpenBackups,
        uiMakeBackup: uiMakeBackup,
        uiEraseData: uiEraseData,
        uiBenchmark: uiBenchmark
    };
}();

PGPilot.init();
