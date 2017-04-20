var React = require('react');
var PropTypes = require('prop-types');
var songApi = require('../utils/songApi');
const PlayList = require('./PlayList');
var Glyphicon = require('react-bootstrap').Glyphicon;
var axios = require('axios');

class Controller extends React.Component {

  formatTime(seconds) {
    var min = Math.floor(seconds / 60);
    var sec = Math.floor(seconds % 60);
    sec = sec < 10 ? "0"+sec : sec;
    return min + ":" + sec;
  }
  render() {
    return (
      <div className='player'>
        <div className='player-content'>
          <Control handleClick={this.props.handleClick.bind(null, 'previous')} icon='fast-backward'/>
          <Play isPlaying={this.props.isPlaying} handleClick={this.props.handleClick} icon='play'/>
          <Control handleClick={this.props.handleClick.bind(null, 'next')} icon='fast-forward'/>
          <div className='durationVolumeControl'>
            { this.props.progress != null &&
            <div className="duration-control">{this.formatTime(this.props.progress.played) + " | " + this.formatTime(this.props.progress.duration)}</div>
          }
            <VolumeControl volume='40'/>
          </div>
        </div>
      </div>
    )
  }
}

class ProgressBar extends React.Component {
  render() {
      var style = {
        width: '0%'
      };
      if( this.props.progress != null ) {
        var percent = (this.props.progress.played / this.props.progress.duration) * 100;
        style = {
          width: percent + '%'
        };
      }
    return(
      <div onClick={this.props.handleClick} className='player-progress'>
        <div style={style != null ? style : null} className='progress-played'>
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
      <div className='volume-control'>
        <div className='volume-range'>
          {/* <div className='volume-range-slider'>slider</div> */}
          <input onChange={function(event){
            console.log("e: " + event.target.value);
          }} className='volume-range-slider' type='range' style={{"display": "inline", "width": "initial"}} />
        </div>
        <Glyphicon onClick={this.handleClick} glyph={iconName}/>
      </div>
    )
  }
}

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: null,
      songList: songApi.getSongList(),
      currentSongIndex: -1,
      isPlaying: false
    }

    this.handleControlClick = this.handleControlClick.bind(this);
    this.handleSongClick = this.handleSongClick.bind(this);
    this.handleProgressClick = this.handleProgressClick.bind(this);
    this.playSong = this.playSong.bind(this);
    // this.playNextSong = this.playNextSong.bind(this);
  }
  componentDidMount() {
    this.songStartTime = 0;
    // Our audio context
    this.audioContext = new(window.AudioContext || window.webKitAudioContext)();
    this.audioSource = null;
    this.audioBuffer = null;
  }

  // Create a new AudioBufferSourceNode
    initAudioSource() {
      this.audioSource = this.audioContext.createBufferSource();
      this.audioSource.buffer = this.audioBuffer;
      this.audioSource.connect(this.audioContext.destination);
      // Bind the callback to this
      this.audioSource.onended = this.playNextSong.bind(this);//endOfPlayback;
    }

    startProgressTimer() {
      this.progressTimerID = window.setInterval(function() {
        var progress = this.state.progress;
        if (progress != null) {
          // console.log("interval progress = " + JSON.stringify(progress));
          progress['played'] = (this.audioContext.currentTime - this.songStartTime);
          this.setState({
            progress: progress
          });
        }
      }.bind(this), 50);
    }

    stopProgressTimer() {
      if( this.progressTimerID != null ) {
        window.clearInterval( this.progressTimerID );
        this.progressTimerID = null;
      }
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
      if (this.audioContext != null && this.audioContext.state != 'running') {
        this.audioContext.resume();
        this.startProgressTimer();
      } else {
        this.playCurrentSong();
      }
    } else {
      if (this.audioContext != null) {
        this.audioContext.suspend();
        this.stopProgressTimer();
      }
    }

var progress = this.state.progress;
progress['played'] = (this.audioContext.currentTime - this.songStartTime);
    this.setState({
      isPlaying: play,
      progress: progress
    });
  }
  handleProgressClick(event) {
    // var percent = Math.round((event.clientX / window.outerWidth) * 100);
    var percent = (event.clientX / window.outerWidth);
    if( this.state.progress != null ) {
      var duration = this.state.progress.duration;
      var played = duration * percent;
      this.audioSource.stop(0);
      this.audioSource.disconnect(this.audioContext.destination);
      this.audioSource = null;
      this.initAudioSource();
      this.audioSource.start(0, played);
      this.songStartTime = this.audioContext.currentTime - played;

      this.setState( {
        progress: {
          played: played,
          duration: duration
        }
      });
    }
  }

  playSong(index) {
    var song = this.state.songList[index];
    this.setState({
      currentSongIndex: index,
      isPlaying: true
    });

    // Clear any existing audio source that we might be using
    if (this.audioSource != null) {
      this.audioSource.disconnect(this.audioContext.destination);
      // Leave existing source to garbage collection
      this.audioSource = null;
    }

    //set the audio file's URL
    var audioURL = song.path; //'../../songs/High.mp3';

    axios({method: 'get', url: audioURL, responseType: 'arraybuffer'})
    .then(function(response) {
      //take the audio from http request and decode it in an audio buffer

      var audioBuffer = null;
      this.audioContext.decodeAudioData(response.data, function(audioBuffer) {

        // In order to play the decoded samples contained in the audio buffer we need to wrap them in
        // an AudioBufferSourceNode object. This object will stream the audio samples to any other
        // AudioNode or AudioDestinationNode object.
        this.audioBuffer = audioBuffer;
        this.initAudioSource();
        // audioSource = audioContext.createBufferSource();
        // source.buffer = audioBuffer; // set the buffer to play to our audio buffer
        // source.connect(audioContext.destination); // connect the source to the output destinarion
        this.audioSource.start(0); // tell the audio buffer to play from the beginning
        this.startProgressTimer();
        var bufferDuration = this.audioSource.buffer.duration;

        this.songStartTime = this.audioContext.currentTime;


this.setState({
  progress: {
    played: 0,
    duration: bufferDuration
  }
})
        // Check for 'running' here in case the context was previously suspended
        if( this.audioContext.state !='running' ) {
          this.audioContext.resume();
        }
      }.bind(this));

    }.bind(this)).catch(function(error) {

      this.setState({
        isPlaying: false,
        progress: null
      });

        console.log("Error: " + error);
        this.stopProgressTimer();
        this.playNextSong();
    }.bind(this));
  }
  render() {
    return (
      <div>
        <Controller isPlaying={this.state.isPlaying}
          progress={this.state.progress}
          handleClick={this.handleControlClick} />
        <ProgressBar progress={this.state.progress} handleClick={this.handleProgressClick} />
        <PlayList handleClick={this.handleSongClick} songs={this.state.songList} activeIndex={this.state.currentSongIndex} />
      </div>
    )
  }
}

module.exports = Player;
