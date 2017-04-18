var React = require('react');
var PropTypes = require('prop-types');
var songApi = require('../utils/songApi');
const PlayList = require('./PlayList');
var Glyphicon = require('react-bootstrap').Glyphicon;
var axios = require('axios');

class Controller extends React.Component {
  render() {
    return (
      <div className='player'>
        <div className='player-content'>
          <Control handleClick={this.props.handleClick.bind(null, 'previous')} icon='fast-backward'/>
          <Play isPlaying={this.props.isPlaying} handleClick={this.props.handleClick} icon='play'/>
          <Control handleClick={this.props.handleClick.bind(null, 'next')} icon='fast-forward'/>
          <VolumeControl volume='40'/>
        </div>
      </div>
    )
  }
}

class ProgressBar extends React.Component {
  render() {
      var style = {
        width: this.props.progress + '%'
      };
    return(
      <div onClick={this.props.handleClick} className='player-progress'>
        <div style={style} className='progress-played'>
          <span className='progress-slider-disc'>
          </span>
        </div>
        <div className='progress-remaining'></div>
      </div>
    )
  }
}

class Control extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div onClick={this.props.handleClick} className='control'>
        <Glyphicon glyph={this.props.icon}/>
      </div>
    )
  }
}
class Play extends Control {
  render() {
    var iconName = this.props.isPlaying ? 'pause' : 'play';
    return (
      <Control handleClick={this.props.handleClick.bind(null, iconName)} icon={iconName} />
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
      progress: 0,
      songList: songApi.getSongList(),
      currentSongIndex: -1,
      isPlaying: false
    }

    window.audioContext = new(window.AudioContext || window.webKitAudioContext)(); // Our audio context
    window.audioSource = null;

    this.handleControlClick = this.handleControlClick.bind(this);
    this.handleSongClick = this.handleSongClick.bind(this);
    this.handleProgressClick = this.handleProgressClick.bind(this);
    this.playSong = this.playSong.bind(this);
  }
  handleControlClick(action) {
    switch (action) {
      case 'play': // fall through
      case 'pause':
        this.togglePlayPause();
        break;
      case 'previous':
        this.playPreviousSong();
        break;
      case 'next':
      this.playNextSong();
        break;
      default:
        //?
    }
  }
  playCurrentSong() {
    // If the 'play' button is clicked as the first action we need to set the current song index to '0'
    var currentSongIndex = this.state.currentSongIndex;
    if( currentSongIndex < 0 ) {
      currentSongIndex = 0;
    }
    this.playSong(currentSongIndex);
  }
  playPreviousSong() {
    var currentSongIndex = this.state.currentSongIndex;
    currentSongIndex--;
    if( currentSongIndex < 0 ) {
      currentSongIndex = this.state.songList.length - 1;
    }
    this.handleSongClick(currentSongIndex);
  }
  playNextSong() {
    var currentSongIndex = this.state.currentSongIndex;
    currentSongIndex++;
    if( currentSongIndex > (this.state.songList.length - 1) ) {
      currentSongIndex = 0;
    }
    this.handleSongClick(currentSongIndex);
  }
  handleSongClick(index) {
    if (index === this.state.currentSongIndex) {
      this.togglePlayPause();
      return;
    } else {
      this.playSong(index);
    }
  }
  togglePlayPause() {
    var play = this.state.isPlaying
      ? false
      : true;
    if (play) {
      if (window.audioContext != null && window.audioContext.state != 'running') {
        window.audioContext.resume();
      } else {
        this.playCurrentSong();
      }
    } else {
      if (window.audioContext != null) {
        window.audioContext.suspend();
      }
    }

    this.setState({isPlaying: play});
  }
  handleProgressClick(event) {
    // var percent = Math.round((event.clientX / window.outerWidth) * 100);
    var percent = (event.clientX / window.outerWidth) * 100;
    this.setState({progress: percent})
  }

  playSong(index) {
    var song = this.state.songList[index];
    this.setState({
      currentSongIndex: index,
      isPlaying: true
    });
    var audioContext = window.audioContext;

    // This is the BufferSource containing the buffered audio
    var source = window.audioSource;

    // Clear any existing audio source that we might be using
    if (source != null) {
      source.disconnect(audioContext.destination);
      // Leave existing source to garbage collection
      source = null;
      // Update the window.audioSource in case the file load fails
      window.audioSource = source;
    }

    //set the audio file's URL
    var audioURL = song.path; //'../../songs/High.mp3';

    axios({method: 'get', url: audioURL, responseType: 'arraybuffer'})
    .then(function(response) {
      //take the audio from http request and decode it in an audio buffer

      var audioBuffer = null;

      audioContext.decodeAudioData(response.data, function(audioBuffer) {

        // In order to play the decoded samples contained in the audio buffer we need to wrap them in
        // an AudioBufferSourceNode object. This object will stream the audio samples to any other
        // AudioNode or AudioDestinationNode object.
        source = audioContext.createBufferSource();
        source.buffer = audioBuffer; // set the buffer to play to our audio buffer
        source.connect(audioContext.destination); // connect the source to the output destinarion
        source.start(0); // tell the audio buffer to play from the beginning

        // Check for 'running' hear in case the context was previously suspended
        if( window.audioContext.state !='running' ) {
          window.audioContext.resume();
        }
        window.audioSource = source;
      });

    }).catch(function(error) {
      console.log("Error: " + error);

      this.setState({
        isPlaying: false
      });
    }.bind(this));
  }
  render() {
    return (
      <div>
        <Controller isPlaying={this.state.isPlaying} handleClick={this.handleControlClick} />
        <ProgressBar progress={this.state.progress} handleClick={this.handleProgressClick} />
        <PlayList handleClick={this.handleSongClick} songs={this.state.songList} activeIndex={this.state.currentSongIndex} />
      </div>
    )
  }
}

module.exports = Player;
