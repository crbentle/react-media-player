var React = require('react');
var PropTypes = require('prop-types');
var Glyphicon = require('react-bootstrap').Glyphicon;
const VolumeControl = require('./VolumeControl');

function Control(props) {
    return (
        <div onClick={props.handleClick} className='control'>
          <Glyphicon glyph={props.icon}/>
        </div>
    );
}

Control.propTypes = {
  icon: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired
};

function Shuffle(props) {
  var className = props.shuffle ? 'on' : 'off';
    return (
        <div onClick={props.handleClick} className={'control shuffle ' + className}>
          <Glyphicon glyph={props.icon}/>
        </div>
    );
}

Shuffle.propTypes = {
  icon: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  shuffle: PropTypes.bool
};

function Play(props) {
  var iconName = props.isPlaying ? 'pause' : 'play';
  return (<Control handleClick={props.handleClick.bind(null, iconName)} icon={iconName}/>);
}

Play.propTypes = {
  icon: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired
};

class ControlPanel extends React.Component {

  // TODO: move formatTime to utils
    formatTime(seconds) {
        var min = Math.floor(seconds / 60);
        var sec = Math.floor(seconds % 60);
        sec = sec < 10  ? "0" + sec  : sec;
        return min + ":" + sec;
    }
    render() {
        return (
          <div className='player'>
            <div className='player-content'>
              <Control handleClick={this.props.handleClick.bind(null, 'previous')} icon='fast-backward'/>
              <Play isPlaying={this.props.isPlaying} handleClick={this.props.handleClick} icon='play'/>
              <Control handleClick={this.props.handleClick.bind(null, 'next')} icon='fast-forward'/>
              <Shuffle handleClick={this.props.handleClick.bind(null, 'shuffle')} icon='random' shuffle={this.props.shuffle}/>
              <div className='durationVolumeControl'>
                {this.props.progress != null &&
                  <div className="duration-control">
                    {this.formatTime(this.props.progress.played) + " | " + this.formatTime(this.props.progress.duration)}
                  </div>
                }
                <VolumeControl handleVolume={this.props.handleVolume} volume={this.props.volume}/>
              </div>
            </div>
          </div>
        );
    }
}

ControlPanel.propTypes = {
  handleClick: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  progress: PropTypes.shape({played: PropTypes.number.isRequired, duration: PropTypes.number.isRequired}),
  handleVolume: PropTypes.func.isRequired,
  volume: PropTypes.number.isRequired,
  shuffle: PropTypes.bool
};

module.exports = ControlPanel;
