var React = require('react');
var PropTypes = require('prop-types');
var Glyphicon = require('react-bootstrap').Glyphicon;

class Control extends React.Component {
  render() {
    return (
      <div onClick={this.props.handleClick} className='control'>
        <Glyphicon glyph={this.props.icon}/>
      </div>
    )
  }
}
class Play extends Control {
  constructor(props) {
    super(props);
    this.state = {
      playing: true
    }

    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(event) {
    var playing = !this.state.playing;
    this.setState( {
      playing: playing
    })
  }
  render() {
    var iconName = this.state.playing ? 'play' : 'pause';
    return (
      <Control handleClick={this.handleClick} icon={iconName} />
    )
  }
}

class VolumeControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      volume: this.props.volume,
      mute: false
    }

    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(event) {
    var mute = this.state.mute
      ? false
      : true;
    this.setState({mute: mute})
  }
  render() {
    var iconName = 'volume-up';
    if (this.state.volume == 0 || this.state.mute) {
      iconName = 'volume-off';
    } else if (this.state.volume < 50) {
      iconName = 'volume-down';
    }
    return (
      <div onClick={this.handleClick} className='volume-control'>
        <Glyphicon glyph={iconName}/>
      </div>
    )
  }
}

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: 0
    }

    this.handledClick = this.handledClick.bind(this);
  }
  handledClick(event) {
    var percent = Math.round((event.clientX / window.outerWidth) * 100);
    this.setState({progress: percent})
  }
  render() {
    var style = {
      width: this.state.progress + '%'
    };
    return (
      <div>
        <div className='player'>
          <div className='player-content'>
            <Control icon='fast-backward'/>
            <Play icon='play'/>
            <Control icon='fast-forward'/>
            <VolumeControl volume='40'/>
          </div>
        </div>
        {/* $("#test").mousemove(function(e){
            var perc = e.offsetX/ $(this).width() * 100;
            $(this).html(e.offsetX + " | " + perc + " perc");
          }); */}
        <div onClick={this.handledClick} className='player-progress'>
          <div style={style} className='progress-played'>
            {/* <span className='progress-slider'>I</span> */}
            <span className='progress-slider-disc'>
              {/* <ul><li></li></ul> */}
            </span>
          </div>
          <div className='progress-remaining'></div>
        </div>
      </div>
    )
  }
}

module.exports = Player;
