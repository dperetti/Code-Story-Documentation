import React, { PropTypes } from 'react'
import { Button } from 'react-bootstrap'
import classnames from 'classnames'

export default class ButtonPlus extends React.Component {

  static propTypes = {
    onClick: PropTypes.func,
    bsStyle: PropTypes.string,
    bsSize: PropTypes.string,
    spinning: PropTypes.bool,
    children: PropTypes.node, // eslint-disable-line
  };

  static defaultProps = {
    spinning: false,
  };

  render() {
    const spinner = <span className="spinner"><span className="fa fa-refresh fa-spin" /></span>
    return (<Button
      onClick={this.props.onClick}
      bsStyle={this.props.bsStyle}
      bsSize={this.props.bsSize}
      className={classnames('has-spinner', { active: this.props.spinning, disabled: this.props.spinning })}
    >
      {spinner}
      {this.props.children}
    </Button>)
  }
}
