
Logs = new Meteor.Collection('logs');

Logs.insertAnalyze = function(node_id, analyze) {
    var node = Nodes.findOne(node_id)
    var nodeLabel = node.host+' ('+node.postgres_port+')'
    Logs.insert({
        command: analyze,
        node_id: node_id,
        nodeLabel: nodeLabel,
        lines: [],
        analyze: true,
        date: new Date()
    });
}

Logs.create = function(node, msg) {
    var nodeLabel = node.host+' ('+node.postgres_port+')'
    return Logs.insert({command: msg, node_id:node._id, nodeLabel: nodeLabel, lines:[], date : new Date()})
}
