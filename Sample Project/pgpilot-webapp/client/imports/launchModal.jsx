import React, { PropTypes } from 'react'
import { render } from 'react-dom';


class ModalWrapper extends React.Component {

  static propTypes = {
  };

  static defaultProps = {
  };


  constructor() {
    super()
    this.state = {
    }
  }

  componentDidMount() {
  }

  render() {
    return (<div {...this.props}>
      ModalWrapper
    </div>)
  }
}

/**
 * Launch a modal
 * @param modal React modal class
 * @param {Object} otherProps
 * @returns {*}
 */
const launchModal = (modal, otherProps) => {  // #aWzaF#
  const mountNode = document.getElementById('modal-placeholder');

    const ModalWrapper = React.createClass({

        getInitialState() {
            var props = _.extend({}, otherProps, {
                handleHide: this.handleHide
            });

            return {
                open: true,
                modal: React.createElement(this.props.modal, props)
            }
        },

        handleHide () {
            this.setState({
                open: false
            });
        },

        componentWillReceiveProps(nextProps) {
            // when openModal wants to render MyModal for the second time,
            // this method is called. This is the opportunity to reopen the modal.
            this.setState({
                open: true
            });
        },
        render() {
            if ( !this.state.open ) {
                return <span/>
            } else return this.state.modal;
        }
    });

    render(<ModalWrapper modal={modal}  />, mountNode);
};

export default launchModal
