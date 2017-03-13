Logs.find({}).observe({
    added: function (item) {
        var terminal = $('#terminal');
        terminal.scrollTop(terminal.prop('scrollHeight'))
    }
});

Logs.find({}).observeChanges({
    changed: function (id, fields) {

        var terminal = $('#terminal');

        if (fields['lines']) {
            terminal.scrollTop(terminal.prop('scrollHeight'))
        }
    }
});


Template.console.helpers({
    commands: function () {
        return Logs.find({});
    }
});

Template.console.events({
        'click button#clear': function (e) {
            Meteor.call('clear_logs')
        }
    }
);
