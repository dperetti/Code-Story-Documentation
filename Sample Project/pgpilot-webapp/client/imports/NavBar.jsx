import { createContainer } from 'meteor/react-meteor-data' // eslint-disable-line
import React, { PropTypes } from 'react'
import { Navbar, Nav, NavItem } from 'react-bootstrap'
import PGPilot from './../api/PGPilot'
import Project from '../../lib/Project'
import EditableSpan from './EditableSpan'

class MainNavbBar extends React.Component {

  static propTypes = {
    projectName: PropTypes.string,
    // spinning: PropTypes.bool,
  };

  handleSaveConfiguration = () => {
    PGPilot.uiSaveConfiguration()
  }

  handleSelect = (eventKey) => {
    switch (eventKey) {
      case 'refresh':
        PGPilot.refresh()
        break;
      case 'new-node': // #q78pK#
        PGPilot.uiEditSettings()
        break;
      case 'save':
        PGPilot.uiSaveConfiguration()
        break;
      default:
        break
    }
  }

  handleBlur = (text) => {
    Project.set({ name: text })
  }

  render() {
    return (<Navbar inverse fixedTop fluid>
      <Navbar.Header>
        <Navbar.Brand>
          <img src="/Logo.png" role="presentation" />
          <span className="title">
            <i><EditableSpan text={this.props.projectName} handleBlur={this.handleBlur} /></i>
          </span>
        </Navbar.Brand>
      </Navbar.Header>
      <Nav bsStyle="pills" pullRight onSelect={this.handleSelect}>
        <NavItem eventKey="refresh">Refresh</NavItem>
        <NavItem eventKey="new-node">New Node</NavItem>{/* #FWNuw# */}
        <NavItem eventKey="save">Save Configuration</NavItem>
      </Nav>
    </Navbar>)
  }
}

export default createContainer(() => ({
  projectName: Project.get('name'),
}), MainNavbBar)
