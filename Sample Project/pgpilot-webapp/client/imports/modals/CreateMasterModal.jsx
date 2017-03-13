import React, { PropTypes } from 'react'
import { Modal, FormGroup, FormControl, ControlLabel, Radio, Checkbox, HelpBlock, Grid, Row, Button, Col } from 'react-bootstrap'

export default class CreateMasterModal extends React.Component { // #EfALP#

  static propTypes = {
    handleSave: PropTypes.func.isRequired,
    handleHide: PropTypes.func,
    title: PropTypes.string,
  };

  static defaultProps = {
    title: 'Init primary server',
    handleSave: () => alert('props.handleSave() must be implemented'), // eslint-disable-line
  };

  constructor() {
    super()
    this.state = {
      postgresUser: 'no-access',
      password: '',
    }
  }

  handleChange(event) {
    this.setState({ postgresUser: event.target.value }) // 'accessible' or 'no-access'
  }

  handleValueChange(key, event) { // currently only used for password
    this.setState({ [key]: event.target.value })
  }

  handleSave = () => {
    this.props.handleHide()
    this.props.handleSave(this.state)
  }

  render() { // #sP7sm#
    return (<Modal
      title={this.props.title}
      bsStyle="primary"
      backdrop
      animation
      show
      onHide={this.props.handleHide}
    >
      <div className="modal-body">
        <Grid fluid>
          <Row>
            <Col md={12}>
              <FormGroup>
                <ControlLabel>PostgreSQL user</ControlLabel>
                <Radio onChange={this.handleChange.bind(this)} value="no-access" name="postgresUser" defaultChecked>
                  No network access
                </Radio>
                <Radio onChange={this.handleChange.bind(this)} value="accessible" name="postgresUser">
                  Password :
                  <FormControl onChange={this.handleValueChange.bind(this, 'password')} value={this.state.password} />
                </Radio>
                {/* <HelpBlock>Blah</HelpBlock> */}
              </FormGroup>
            </Col>
          </Row>
        </Grid>
      </div>
      <div className="modal-footer">
        <Button onClick={this.props.handleHide}>Cancel</Button>
        <Button onClick={this.handleSave} bsStyle="success">Create</Button>
      </div>
    </Modal>)
  }
}
