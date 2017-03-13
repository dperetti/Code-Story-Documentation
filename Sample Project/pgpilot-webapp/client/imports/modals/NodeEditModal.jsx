import React, { PropTypes } from 'react'
import { Modal, FormGroup, FormControl, ControlLabel, Checkbox, HelpBlock, Grid, Row, Button, Col } from 'react-bootstrap'

export default class NodeEditModal extends React.Component {

  static propTypes = {
    model: PropTypes.object,
    handleHide: PropTypes.func,
    handleSave: PropTypes.func,
  }

  constructor(props) {
    super()
    // If we're creating a new node, no model was passed, so it's null.
    if (props.model == null) { // #ttxNh#
      this.state = {
        mode: 'new',
        name: '',
        host: '',
        websocket_port: 8888,
        postgres_port: 5432,
        check_server_cert: false,
      }
    } else {
      this.state = _.pick(props.model, 'name', 'host', 'websocket_port', 'postgres_port', 'password', 'check_server_cert', 'server_cert');
      this.state.mode = 'edit';
    }
    this.handleValueChange = this.handleValueChange.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleCheckChange = this.handleCheckChange.bind(this)
  }

  handleValueChange(key, event) {
    this.setState({ [key]: event.target.value })
    console.log("key", key) // eslint-disable-line
    console.log("val", event.target.value) // eslint-disable-line
  }

  handleCheckChange(key, event) {
    this.setState({ [key]: event.target.checked })
    console.log("key", key) // eslint-disable-line
    console.log("val", event.target.checked) // eslint-disable-line
  }

  handleSave() {  // #TuC43#
    if (!this.state.host) {
      alert('IP must be set')
    } else {
      this.props.handleHide()
      this.props.handleSave(this.state)
    }
  }

  render() {
    return (<Modal
      title="Node settings"
      bsStyle="primary"
      backdrop
      animation
      show
      onHide={this.props.handleHide}
    >
      <div className="modal-body">
        <Grid fluid>
          <Row>
            <Col md={6}>
              <FormGroup>
                <ControlLabel>Name</ControlLabel>
                <FormControl onChange={this.handleValueChange.bind(this, 'name')} value={this.state.name} type="text" placeholder="Development" />
                <HelpBlock>Description of the node</HelpBlock>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <ControlLabel>HOST or IP</ControlLabel>
                <FormControl onChange={this.handleValueChange.bind(this, 'host')} value={this.state.host} type="text" label="HOST or IP" placeholder="Ex: 192.168.0.1" />
                <HelpBlock>HOST or IP Address of the node</HelpBlock>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <ControlLabel>Websocket port of the node</ControlLabel>
                <FormControl onChange={this.handleValueChange.bind(this, 'websocket_port')} value={this.state.websocket_port} type="text" placeholder="ex: 8888" />
                <HelpBlock>The external port you set when you launched the docker container</HelpBlock>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <ControlLabel>PostgreSQL port</ControlLabel>
                <FormControl onChange={this.handleValueChange.bind(this, 'postgres_port')} value={this.state.postgres_port} type="text" placeholder="ex: 5432" />
                <HelpBlock>The external port you set when you launched the docker container</HelpBlock>
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <ControlLabel>PGPilot Password</ControlLabel>
            <FormControl onChange={this.handleValueChange.bind(this, 'password')} value={this.state.password} type="textarea" placeholder="ex: TheSuperPAsSwOrD" />
            <HelpBlock>PG Pilot password you set when you launched the docker container</HelpBlock>
          </FormGroup>
          <FormGroup>
            <Checkbox onChange={this.handleValueChange.bind(this, 'check_server_cert')} checked={this.state.check_server_cert}>Check server certificate</Checkbox>
          </FormGroup>
          <FormGroup>
            <ControlLabel>Certificate</ControlLabel>
            <FormControl onChange={this.handleCheckChange.bind(this, 'server_cert')} value={this.state.server_cert} type="textarea" placeholder="-----BEGIN CERTIFICATE-----..." />
            <HelpBlock>(server.pem)</HelpBlock>
          </FormGroup>
        </Grid>
      </div>
      <div className="modal-footer">
        <Button onClick={this.props.handleHide}>Cancel</Button>
        <Button bsStyle="success" onClick={this.handleSave}>{this.state.mode === 'edit' ? 'Save Changes' : 'Create Node'}</Button>
      </div>
    </Modal>)
  }
}
