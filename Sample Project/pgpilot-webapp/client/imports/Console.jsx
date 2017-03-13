/*
    UNUSED at the moment.
    We're still using Blaze for performances reasons.
    https://forums.meteor.com/t/getmeteordata-is-slow/16171
    Also "lines" (subcollection of Logs) are not correctly updated here.
 */
Console = React.createClass({

    mixins: [ReactMeteorData],

    getMeteorData() {
        return {
            commands:  Logs.find({}).fetch()
        }
    },

    render() {

        return <div id="console" className="collapse">
            <button id="clear" className="btn btn-default btn-xs" type="submit">Clear</button>
            <pre id="terminal">
                { this.data.commands.map ( (c) => {
                    return <div key={c._id}>
                        <span className="command label label-default">{c.nodeLabel}</span>
                        <span className={classNames('command', 'label', {'label-primary': c.analyze, 'label-default': !c.analyze})}>{c.command}</span>
                        <div>
                            { c.lines.map( (line) => {
                                <span className={classNames({'error': line.isError, 'server-command': line.isCommand})}>qds{line.txt}blash</span>
                            })}
                        </div>
                    </div>
                })}

            </pre>
        </div>

    }
})
