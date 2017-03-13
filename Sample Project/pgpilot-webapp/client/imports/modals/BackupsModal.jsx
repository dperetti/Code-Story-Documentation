import React, { PropTypes } from 'react'
import { Modal, Table, Glyphicon, Button } from 'react-bootstrap'
import { createContainer } from 'meteor/react-meteor-data' // eslint-disable-line

class BackupsModal extends React.Component {

  static propTypes = {
    node: PropTypes.object.isRequired, // eslint-disable-line
    handleHide: PropTypes.func,
    files: PropTypes.array, // eslint-disable-line
  };

  static defaultProps = {
  };

  constructor(props) {
    super()
    this.state = {
      selectedItem: null,
    }
  }


  handleClick = (key) => {
    this.setState({ selectedItem: key })
  }

  handleDeleteBackup = () => {
    const node = this.props.node
    if (confirm(`Are you sure you want to delete the backup ${this.state.selectedItem} ?`)) {
      Meteor.call('cmd_delete_backup', node, this.state.selectedItem)
    }
  }

  handleRestoreBackup = () => {
    const node = this.props.node
    if (confirm(`Are you sure you want to restore the database to ${this.state.selectedItem} ?`)) {
      Meteor.call('cmd_restore_backup', node, this.state.selectedItem)
    }
  }

  render() {
    const rowStyle = { cursor: 'pointer' }
    const dateStyle = { width: '15%', whiteSpace: 'noWrap' }
    const nameStyle = { width: '70%' }

    console.log("this.state", this.state) // eslint-disable-line
    const files = this.props.files.map((f) => {
      const selected = this.state.selectedItem === f.name
      return (<tr key={f.name} onClick={this.handleClick.bind(this, f.name)} style={rowStyle}>
        <td><Glyphicon glyph={selected ? 'check' : 'unchecked'} /></td>
        <td style={nameStyle}>{f.name}</td>
        <td style={dateStyle}>{f.size}</td>
        <td style={dateStyle}>{f.date}</td>
      </tr>)
    })

    return (<Modal
      title="Backups"
      bsStyle="primary"
      backdrop
      animation
      show
      onRequestHide={this.props.handleHide}
    >
      <div className="modal-body">
        <Table condensed fill>
          <tbody>
            {files}
          </tbody>
        </Table>
      </div>
      <div className="modal-footer">
        <Button onClick={this.props.handleHide}>Close</Button>
        <Button bsStyle="danger" disabled={this.state.selectedItem == undefined} onClick={this.handleDeleteBackup}>Delete Backup</Button>
        <Button bsStyle="primary" disabled={this.state.selectedItem == undefined} onClick={this.handleRestoreBackup}>Restore Backup</Button>
      </div>
    </Modal>)
  }
}

export default createContainer((props) => {
  const backups = ModalItems.findOne({ key: 'backups', node_id: props.node._id });
  return {
    files: backups ? backups.files : [],
  }
}, BackupsModal);


// BackupsModal = React.createClass({
//
//     mixins: [React.addons.LinkedStateMixin],
//
//     propTypes: {
//         node: React.PropTypes.object.isRequired
//     },
//
//     getMeteorState() {
//
//         var backups = ModalItems.findOne({key:'backups', node_id: this.props.node._id});
//
//         return {
//             files: backups ? backups.files : []
//         };
//     },
//
//     getInitialState() {
//
//         return {
//
//         }
//     },
//
//     handleClick: function(key) {
//         this.setState({selectedItem: key});
//     },
//
//     handleDeleteBackup: function() {
//
//         var node = this.props.node;
//         if (confirm("Are you sure you want to delete the backup " + this.state.selectedItem +" ?")) {
//             Meteor.call('cmd_delete_backup', node, this.state.selectedItem);
//         }
//     },
//
//     handleRestoreBackup: function() {
//
//         var node = this.props.node;
//         if (confirm("Are you sure you want to restore the database to " + this.state.selectedItem + " ?")) {
//             Meteor.call('cmd_restore_backup', node, this.state.selectedItem);
//         }
//     },
//
//     render() {
//         var rowStyle = {cursor: 'pointer'};
//         var dateStyle = {width: "15%", whiteSpace: "noWrap"};
//         var nameStyle = {width: "70%"};
//
//         var files = _.map(this.state.files, function (f) {
//
//             var selected = this.state.selectedItem == f.name;
//
//             return <tr key={f.name} onClick={this.handleClick.bind(this, f.name)} style={rowStyle}>
//                 <td><Glyphicon glyph={selected ? 'check' : 'unchecked'} /></td>
//                 <td style={nameStyle}>{f.name}</td>
//                 <td style={dateStyle}>{f.size}</td>
//                 <td style={dateStyle}>{f.date}</td>
//             </tr>;
//         }, this);
//
//         return (
//             <Modal ref="modal" title='Backups'
//                 bsStyle='primary'
//                 backdrop={true}
//                 animation={true}
//                 show={true}
//                 onRequestHide={this.props.handleHide}>
//
//                 <div className='modal-body'>
//                     <Table condensed fill>
//                         <tbody>
//                         {files}
//
//                         </tbody>
//                     </Table>
//
//                 </div>
//                 <div className='modal-footer'>
//                     <Button onClick={this.props.handleHide}>Close</Button>
//                     <Button bsStyle='danger' disabled={this.state.selectedItem == undefined} onClick={this.handleDeleteBackup}>Delete Backup</Button>
//                     <Button bsStyle='primary' disabled={this.state.selectedItem == undefined} onClick={this.handleRestoreBackup}>Restore Backup</Button>
//                 </div>
//             </Modal>
//         )
//     }
// });
