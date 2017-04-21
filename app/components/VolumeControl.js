var React = require('react');
import PropTypes from 'prop-types';
var Glyphicon = require('react-bootstrap').Glyphicon;

class VolumeControl extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }
    handleClick(value) {
        this.props.handleVolume(parseInt(value));
    }
    render() {
        var iconName = 'volume-up';
        if (this.props.volume == 0) {
            iconName = 'volume-off';
        } else if (this.props.volume < 50) {
            iconName = 'volume-down';
        }

        return (
            <div className='volume-control'>
                <div className='volume-range'>
                    <input
                      onChange={function(event) {
                        this.handleClick(event.target.value);
                      }.bind(this)}
                      className='volume-range-slider'
                      type='range'
                      value={this.props.volume}
                      style={{
                        "display": "inline",
                        "width": "initial"
                      }}
                    />
                </div>
                <Glyphicon onClick={this.handleClick.bind(this, -1)} glyph={iconName}/>
            </div>
        )
    }
}

VolumeControl.propTypes = {
    volume: PropTypes.number.isRequired,
    handleVolume: PropTypes.func.isRequired
};

module.exports = VolumeControl;
