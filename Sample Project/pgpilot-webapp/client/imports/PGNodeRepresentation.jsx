import React, { PropTypes } from 'react'
// import { Button, Glyphicon, Panel, DropdownButton, MenuItem, ProgressBar, OverlayTrigger, Popover, Grid, Row, Col, Table, Label } from 'react-bootstrap'
import { Button, Glyphicon, Panel, DropdownButton, MenuItem, ProgressBar, OverlayTrigger, Popover, Table, Label } from 'react-bootstrap'
import classNames from 'classnames'
import ButtonPlus from './ButtonPlus.jsx'
import PGPilot from '../api/PGPilot'

const NODE_STATES = {
  NOT_A_DB_CLUSTER: <Label>Not a database cluster yet</Label>,
  CREATING_SLAVE: 'Creating slave...',
  NO_SERVER_RUNNING: <Label bsStyle="danger">Server is down</Label>,
  SERVER_IS_RUNNING: <Label bsStyle="success">Server is up</Label>,
}
export default class PGNodeRepresentation extends React.Component {

  static propTypes = {
    model: PropTypes.object, // eslint-disable-line
    master_nodes: PropTypes.array, // eslint-disable-line
  };

  onConnect() {
    PGPilot.connect(this.props.model)
  }

  onCreateMaster() { // #AevV8#
    PGPilot.createMaster(this.props.model._id)
  }

  onCreateSlave(node_id, master_node_id, event) { // #EuUua#
    PGPilot.createSlave(node_id, master_node_id)
  }

  onStartServer() {
    PGPilot.startServer(this.props.model._id)
  }

  onStopServer() {
    PGPilot.stopServer(this.props.model._id)
  }

  onPromoteToMaster() {
    PGPilot.promoteToMaster(this.props.model._id)
  }

  onDropReplicationSlot(slot_name) {
    PGPilot.dropReplicationSlot(this.props.model._id, slot_name)
  }

  /** Dropdown menus and button Actions **/
  handleSelectAction(node_id, eventKey, event) {
    switch (eventKey) {
      case 'edit':
        PGPilot.uiEditSettings(this.props.model._id)
        break
      case 'delete':
        PGPilot.uiDeleteNode(this.props.model._id)
        break
      case 'postgres_password':
        PGPilot.uiChangePostgresPassword(this.props.model._id)
        break
      case 'make_backup':
        PGPilot.uiMakeBackup(this.props.model._id)
        break
      case 'backups':
        PGPilot.uiOpenBackups(this.props.model._id)
        break
      case 'erase':
        PGPilot.uiEraseData(this.props.model._id)
        break
      case 'benchmark':
        PGPilot.uiBenchmark(this.props.model._id)
        break
      default:
        break;
    }
  }

  render() {
    const model = this.props.model

    const classSet = classNames({
      socket: true,
      up: model.state === 'SERVER_IS_RUNNING',
      disconnected: !model.connected,
    })

    let status

    if (model.connected) {
      status = (<div className="node-status">
        <span className="state">{NODE_STATES[model.state]}</span>
        <span className="disk-usage">{model.disk_usage}&nbsp;/&nbsp;{model.free_space}</span>
      </div>)
    } else {
      status = (<div className="node-status">
        <div>Connection to the node is broken. Try to reconnect.</div>
      </div>)
    }

    const header = (<div>
      <div>{model.name}</div>
      <span className="address">
        <span className="host">{model.host}</span>
        :
        <span className="postgres-port">{model.postgres_port}</span>
        &nbsp;
        <span className="websocket-port">{model.websocket_port}</span>
      </span>
      <div className="node-edit-button">
        <DropdownButton
          title={<span className="fa fa-cogs" aria-hidden="true" />}
          onSelect={this.handleSelectAction.bind(this, model._id)}
          bsStyle="link" noCaret pullRight id="popover"
        >
          <MenuItem eventKey="edit">Edit</MenuItem>
          <MenuItem eventKey="delete">Delete Node</MenuItem>
          <MenuItem eventKey="postgres_password">Change postgres User Password</MenuItem>
          <MenuItem divider />
          <MenuItem eventKey="make_backup">Make Backup...</MenuItem>
          <MenuItem eventKey="backups">Backups...</MenuItem>
          <MenuItem divider />
          <MenuItem eventKey="erase">Erase database cluster</MenuItem>
          <MenuItem divider />
          <MenuItem eventKey="benchmark">Run benchmark test</MenuItem>
        </DropdownButton>
      </div>
      {status}
    </div>)

    let slaveSection = null
    let slotsSection = null
    let replicationsSection = null
    let databasesSection = null
    let actionsSection = <div />

    if (model.state !== 'NOT_A_DB_CLUSTER') {
      if (model.slave_of) {
        const primary = Nodes.findOne(model.slave_of)
        if (primary) {
          slaveSection = (<tr>
            <td colSpan="2">SLAVE &#8592; {primary.host} ({primary.postgres_port})</td>
          </tr>)
        }
      } else {
        if (model.slots && model.slots.length > 0) {
          const t = <Glyphicon glyph="ban-circle" />
          slotsSection = (<tr>
            <td>slots</td>
            <td className="slots">
              {model.slots.map((r) => {
                const statusClassSet = classNames({
                  'slot-status': true,
                  'slot-status-up': r.active,
                  'slot-status-down': !r.active,
                })
                let deleteSlotButton = ''
                if (!r.active) {
                  deleteSlotButton = (<Button
                    onClick={this.onDropReplicationSlot.bind(this, r.slot_name)}
                    bsStyle="link" bsSize="xsmall"
                    className="button-delete"
                  >{t}</Button>)
                }
                return (<div className="slot" key={r.slot_name}>
                  <div className={statusClassSet} />
                  <span className="label label-default">{r.slot_name}</span>
                  {deleteSlotButton}
                </div>)
              })}
            </td>
          </tr>)
        }
        if (model.replications && model.replications.length > 0) {
          replicationsSection = (<tr>
            <td>replications</td>
            <td className="replications">
              {model.replications.map((r, i) => <div key={r.client_addr + i}>{r.client_addr}&nbsp;{r.state}</div>)}
            </td>
          </tr>)
        }
      }
    }
    if (model.connected) {
      if (model.state === 'NOT_A_DB_CLUSTER') {
        actionsSection = (<div>
          <ButtonPlus
            onClick={this.onCreateMaster.bind(this)}  // #ulcSu#
            bsStyle="default" bsSize="small"
            spinning={model.running_command === 'init_primary'}
          >Create Master</ButtonPlus>
          &nbsp;
          <DropdownButton
            title="Create Slave" bsSize="small" pullRight // #mxfVL#
            onSelect={this.onCreateSlave.bind(this, model._id)} id="create-slave-dropdown"
          >
            <MenuItem header>Choose Master:</MenuItem>
            {this.props.master_nodes.filter(n => n._id !== model._id).map((r) => {
              const disabled = r.state !== 'SERVER_IS_RUNNING' ? 'disabled' : ''
              return (<MenuItem
                eventKey={r._id}
                key={r._id}
                className={disabled}
              >
                {r.host} {r.postgres_port} {r.state !== 'SERVER_IS_RUNNING' ? 'Not started' : ''}
              </MenuItem>) })}
          </DropdownButton>
        </div>)
      }
      if (model.state === 'CREATING_SLAVE') {
        actionsSection = (<div>
          <ProgressBar striped active now={model.progress} />
        </div>)
      }
      if (model.state === 'NO_SERVER_RUNNING') {
        actionsSection = (<div>
          <ButtonPlus
            onClick={this.onStartServer.bind(this)}
            bsStyle="success" bsSize="xsmall" spinning={model.running_command === 'start'}
          >Start Server</ButtonPlus>
        </div>)
      }
      if (model.state === 'SERVER_IS_RUNNING') {
        if (model.databases && model.databases.length > 0) {
          const style = {
            fontSize: '11px',
            fontWeight: 'normal',
            backgroundColor: '#999',
            cursor: 'pointer',
          }
          const databaseIcon = <span className="fa fa-database" aria-hidden="true" />
          const tableIcon = <span className="fa fa-table" aria-hidden="true" />
          databasesSection = (<tr>
            <td colSpan="2">
              {model.databases.map((database, i) => {
                let tables
                if (database.tables.length > 0) {
                  tables = database.tables.map(r => (<span className="badge" style={style} key={r[0]}>
                    {tableIcon}&nbsp;{r[0]}&nbsp;({r[1]})
                  </span>)
                )
                } else {
                  tables = <span><i>Empty database</i></span>
                }
                const popoverTitle = <span>{databaseIcon}&nbsp;{database.name}</span>
                const content = <Popover title={popoverTitle} id="popover">{tables}</Popover>
                return (<OverlayTrigger trigger={['hover', 'focus']} placement="bottom" overlay={content} key={database.name}>
                  <span className="badge" style={style}>
                    {databaseIcon}&nbsp;{database.name}&nbsp;({database.tables.length})
                  </span>
                </OverlayTrigger>)
              })}
            </td>
          </tr>)
        }
        const children = []

        // Progress if any
        if (model.running_command === 'backup') {
          children.push(<ProgressBar key="progress" active now={100} label="Backup in Progress" />)
        }

        // Stop server button
        children.push(<ButtonPlus
          key="stop"
          onClick={this.onStopServer.bind(this)}
          bsStyle="danger"
          bsSize="xsmall"
          spinning={model.running_command === 'stop'}
        >Stop Server</ButtonPlus>)

        // Promote to master button if flase
        if (model.slave_of) {
          // children.push(<span>&nbsp;</span>)
          children.push(<ButtonPlus
            key="promote"
            onClick={this.onPromoteToMaster.bind(this)} bsStyle="warning" bsSize="xsmall"
            spinning={model.running_command === 'promote_to_master'}
          >Promote to master</ButtonPlus>)
        }
        actionsSection = <div>{children}</div>
      }
    } else {
      actionsSection = <Button onClick={this.onConnect.bind(this)}>Connect</Button>
    }
    return (<Panel header={header} className="node">
      <Table condensed fill>
        <tbody>
          {databasesSection}
          {slaveSection}
          {slotsSection}
          {replicationsSection}
        </tbody>
      </Table>
      {actionsSection}
    </Panel>)
  }


}
