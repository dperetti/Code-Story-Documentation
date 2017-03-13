import React, { PropTypes } from 'react'

export default class EditableSpan extends React.Component {

  static propTypes = {
    text: PropTypes.string,
    handleBlur: PropTypes.func,
  };

  static defaultProps = {
    handleBlur: () => {},
  };


  constructor(props) {
    super()
    this.state = {
      text: props.text,
      editing: false,
    }
  }

  componentWillReceiveProps(props) {
    this.setState({ text: props.text })
  }

  handleChange = (event) => {
    this.setState({ text: event.target.value })
  }

  handleKeyDown = (event) => {
    if (_.contains([9, 13, 38, 40], event.which)) {
      event.preventDefault()
    }
  }

  handleKeyUp = (event) => {
    if (event.which === 13) {
      event.preventDefault()
      this.handleBlur()
    }
  }

  handleBlur = (event) => {
    this.setState({ editing: false })
    this.props.handleBlur(this.state.text)
  }

  handleClick = (event) => {
    this.setState({ editing: true })
  }

  render() {
    const style = {
      backgroundColor: 'transparent',
      minWidth: '100px',
    }
    if (this.state.editing) {
      return (<input
        type="text" value={this.state.text} style={style}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        onBlur={this.handleBlur}
      />)
    }
    const t = (this.state.text && this.state.text.length > 0) ? this.state.text : '<Untitled>'
    return <span style={style} onClick={this.handleClick}>{t}</span> // eslint-disable-line
  }
}
