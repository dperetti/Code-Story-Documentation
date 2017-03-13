import React, { PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data' // eslint-disable-line
import PGNodeRepresentation from './PGNodeRepresentation.jsx'

class PGNodes extends React.Component { // eslint-disable-line
  static propTypes = {
    nodes: PropTypes.array, // eslint-disable-line
    master_nodes: PropTypes.array, // eslint-disable-line
  }

  render() {
    return (<div className="container">
      <div className="row">
        {this.props.nodes.map(node => <div className="col-md-4" key={node._id}>
          <PGNodeRepresentation model={node} master_nodes={this.props.master_nodes} />
        </div>)}
      </div>
    </div>)
  }
}

export default createContainer(() => ({
  nodes: Nodes.find({}, { sort: { name: 1 } }).fetch(),
  master_nodes: Nodes.find({ connected: true }, { fields: { state: 1, ip: 1, _id: 1, postgres_port: 1 } }).fetch(),
}), PGNodes);
