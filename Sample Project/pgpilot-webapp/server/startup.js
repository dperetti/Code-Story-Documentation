import Project from '../lib/Project'
import fs from 'fs'
import Path from 'path'
Meteor.startup(function () { // #NRSMr#
    // We don't need data persitence, except for the configuration which we store in a yaml file called pgpilot.yaml.
    // Meteor's MongoDB is only used to deal with session data so it's ok to clean up everything on startup.

    Nodes.remove({});
    Logs.remove({});

    // Try to load a pgpilot.yaml configuration file from disk
    // var fs = Meteor.npmRequire('fs');
    // var Path = Meteor.npmRequire('path')

    // During development, we'll use the pgpilot.yaml that's in the current directory.
    // When run in Docker, it's set to /config by the Dockerfile.
  	var configuration_dir = process.env.CONFIGURATION_DIR || process.env.PWD

    var path

    var path = Path.join(configuration_dir, 'pgpilot.yaml')

    try {
        var data = YAML.safeLoad(fs.readFileSync(path), 'utf8');
        // Instantiate the nodes from what we found in the configuration file
        Comm.createNodesFromConfig(data.nodes);
        // Set the name of the project
        Project.set({name: data.projectName})
    } catch (e) {
        console.log("No configuration file at path " + path);
    }

    /**
     * Associate the running command to the node so the UI can
     * react accordingly
     * @param  {Node} node
     * @param  {string} cmd  Command
     */
    var node_set_running_command = function(node, cmd) {
        Nodes.update(node._id, {
            $set: {
                running_command: cmd
            }
        });
    };

    // server methods that can be called from the client
    Meteor.methods({

            /**
             * Save configuration to disk
             */
            saveConfiguration: function() {
                // var fs = Meteor.npmRequire('fs');

                var nodes = _.map(Nodes.find({}).fetch(), function(r) {return _.pick(r, 'name', 'host', 'password',
                'server_cert', 'postgres_port', 'websocket_port', 'check_server_cert')});


                var data = {
                    projectName: Project.get('name'),
                    nodes: nodes
                };

                var yml = YAML.safeDump(data);
                fs.writeFile(path, yml);

            },

            /**
             * Check status of every node.
             */
            cmd_all_statuses: function () {
                _.each(Nodes.find({connected: true}).fetch(), function (item) {
                    node_set_running_command(item, null);
                    Controller.sendCommand(item, "status")
                });

            },
            /**
             * Start PostgreSQL on node.
             * @param node
             */
            cmd_start: function (node) {
                node_set_running_command(node, "start");
                Controller.sendCommand(node, "start", function () {
                    Meteor.call('cmd_all_statuses');
                    node_set_running_command(node, null)
                })
            },

            /**
             * Stop PostgreSQL on node.
             * @param node
             */
            cmd_stop: function (node) {
                node_set_running_command(node, "stop")
                Controller.sendCommand(node, "stop", function () {
                    Meteor.call('cmd_all_statuses');
                    node_set_running_command(node, null)
                })
            },

            /**
             * Promote a slave postgreSQL server node to master.
             * @param node
             */
            cmd_promote_to_master: function (node) {
                node_set_running_command(node, "promote_to_master");
                Controller.sendCommand(node, "promote_to_master", function () {
                    Meteor.call('cmd_all_statuses');
                    node_set_running_command(node, null);
                })
            },

            /**
             * Drop a replication slot on a master server node.
             * @param node
             * @param slot_name
             */
            cmd_drop_replication_slot: function (node, slot_name) {
                Controller.sendCommand(node, ["drop_replication_slot", slot_name], function () {
                    Meteor.call('cmd_all_statuses')
                })
            },

            /**
             * Change postgres user's password on node.
             * @param node
             * @param password
             */
            cmd_change_postgres_password: function (node_id, password) {
                var node = Nodes.findOne(node_id);

                if ( password == null ) {
                    password = 'md5' + CryptoJS.MD5('postgres').toString()
                } else {
                    // pre-hashed passwords start with "md5" by postgreSQL convention.
                    password = 'md5' + CryptoJS.MD5(password+'postgres').toString()
                }

                Controller.sendCommand(node, ["change_postgres_password", password], function () {
                    Meteor.call('cmd_all_statuses')
                })
            },

            cmd_make_backup: function (node, name) {

                node_set_running_command(node, "backup");
                Controller.sendCommand(node, ["make_backup", name], function () {
                    Meteor.call('cmd_all_statuses');
                    node_set_running_command(node, null);
                })
            },

            cmd_get_backups: function (node) {

                Controller.sendCommand(node, ["backups"], function (r) {

                    var files = _.map(JSON.parse(r), function (arr) {

                        return {
                            name: arr[0],
                            date: moment.unix(arr[1]).fromNow(),
                            size: filesize(arr[2]),
                            ord: -Number(arr[1])
                        }
                    });
                    files = _.sortBy(files, 'ord');
                    ModalItems.upsert({key: "backups", node_id: node._id}, {$set: {key: "backups", node_id: node._id, files: files}});
                });

            },

            cmd_delete_backup: function (node, name) {

                Controller.sendCommand(node, ["delete_backup", name], function () {
                    Meteor.call('cmd_get_backups', node)
                })
            },

            cmd_restore_backup: function (node, name) {

                Controller.sendCommand(node, ["restore_backup", name], function () {
                    Meteor.call('cmd_all_statuses')
                })
            },

            cmd_erase_node: function (node) {

                Controller.sendCommand(node, ["erase"], function () {
                    Meteor.call('cmd_all_statuses')
                })
            },

            cmd_benchmark: function (node) {

                Controller.sendCommand(node, ["bench"], function () {
                    Meteor.call('cmd_all_statuses')
                })
            },

            reconnect: function (node) {

                var nd = Nodes.findOne(node._id);
                Comm.createSocket(nd);
            },

            clear_logs: function () {
                Logs.remove({});
            },

            init_primary: function (node_id, postgres_password) { // #uzGpj#

                // flag the node as being a master
                Nodes.update(node_id, {
                    $set: {
                        master: true
                    }
                });
                var node = Nodes.findOne(node_id);

                // let the UI know that the node it initializing a master primary
                node_set_running_command(node, "init_primary");

                if (postgres_password == null) { // no postgres password
                    postgres_password = -1
                } else {
                    // The user set a password. We crypt it with the "md5" + md5(pass+salt) convention.
                    // http://stackoverflow.com/questions/17429040/creating-user-with-encrypted-password-in-postgresql
                    postgres_password = 'md5' + CryptoJS.MD5(postgres_password+'postgres').toString()
                }
                // send the command to the server
                Controller.sendCommand(node, "init_primary " + postgres_password, function() {
                    node_set_running_command(node, null); // let the UI know the command is no longer running.
                })
            },

            action_create_slave: function (node_id, master_node_id) { // #Pg3rR#

                var slave_node = Nodes.findOne(node_id);
                var master_node = Nodes.findOne(master_node_id);

                Nodes.update(node_id, {$set: {state: "CREATING_SLAVE"}});

                // Generate a slot name based on the slave ip and port.
                // (the replication slot will be created on the master)
                var replication_slot_name = (slave_node.host + "__" + slave_node.postgres_port).replace(/(\.)/g, '_');

                // The role used for this replication is by default based on the slot name.
                var replication_user = "repl_" + replication_slot_name;  // TODO: rename to replication_role

                // Generate a password for the replication role.
                var replication_password = Math.random().toString(36).slice(2);

                // However, the settings we just defined are not appropriate if we're creating a slave of... another
                // slave, because the slave is read-only.
                // So in that case, instead of creating a new role, we will re-use the role of the first slave in the
                // hierarchy.

                var root_master = master_node;
                var top_slave_node = null;

                // is the master the slave of some other server ?
                var slave_of_slave = false;

                while (root_master.slave_of != null) {
                    slave_of_slave = true;
                    top_slave_node = root_master;
                    root_master = Nodes.findOne(root_master.slave_of);
                }

                // see slave of slave explanation
                var create_replication_slot = function(master_node, slave_node, replication_slot_name, replication_user, replication_password, use_existing_replication_role) {

                    // #kbLA6#
                    Controller.sendCommand(master_node, ["create_replication_slot", replication_slot_name, use_existing_replication_role ? '-1' : replication_user, use_existing_replication_role ? '-1' : replication_password], function () {

                        // init db on slave #SjMEb#
                        var cmd_init_slave = ["init_slave", master_node.host, master_node.postgres_port, replication_slot_name, replication_user, replication_password];

                        Controller.sendCommand(slave_node, cmd_init_slave, function () {
                            Controller.sendCommand(slave_node, "status");
                            Controller.sendCommand(master_node, "status");
                        });

                    });
                };

                if ( slave_of_slave ) {

                    // So, the master of the slave is actually the slave of another server.
                    // We will now retrieve the replication password from the slave we found at the top of the
                    // hierarchy (the one which is the direct slave of the primary).
                    // (see action.py > cmd_get_replication_password()).
                    //
                    Controller.sendCommand(top_slave_node, "get_replication_password", function (pgpass) {

                        var r = pgpass.split(":");
                        var replication_user = r[0];
                        var replication_password = r[1];

                        // create replication slot but use the current replication role
                        create_replication_slot(master_node, slave_node, replication_slot_name, replication_user, replication_password, true);
                    })

                } else {

                    create_replication_slot(master_node, slave_node, replication_slot_name, replication_user, replication_password, false);
                }
            }
        }
    );
});
