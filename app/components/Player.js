const React = require('react');
const PropTypes = require('prop-types');
const songApi = require('../utils/songApi');
const PlayList = require('./PlayList');
const ControlPanel = require('./ControlPanel');
const ProgressBar = require('./ProgressBar');
const axios = require('axios');
var CancelToken = axios.CancelToken;

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: null,
      songList: songApi.getSongList(),
      currentSongIndex: -1,
      isPlaying: false,
      volume: 100,
      mute: false
    }

    this.handleControlClick = this.handleControlClick.bind(this);
    this.handleSongClick = this.handleSongClick.bind(this);
    this.handleProgressClick = this.handleProgressClick.bind(this);
    this.playSong = this.playSong.bind(this);
    this.handleVolume = this.handleVolume.bind(this);
  }
  componentDidMount() {
    this.songStartTime = 0;
    this.audioContext = new(window.AudioContext || window.webKitAudioContext)();
    this.audioSource = null;
    this.audioBuffer = null;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    /*
     * A method that can cancel a request
     *  if a new request comes in before the previous one finished.
     * This would happen if the previos or next buttons were clicked
     *  faster than the requests are finishing.
    */
    this.cancelAxios;
  }

  // Create a new AudioBufferSourceNode
  initAudioSource() {
    this.clearAudioSource();
    this.audioSource = this.audioContext.createBufferSource();
    this.audioSource.buffer = this.audioBuffer;
    // this.audioSource.connect(this.audioContext.destination);
    this.audioSource.connect(this.gainNode);
    // Bind the callback to this
    this.audioSource.onended = this.playNextSong.bind(this); //endOfPlayback;
    this.startProgressTimer();
  }

  clearAudioSource() {
    this.stopProgressTimer();

    // Clear any existing audio source that we might be using
    if (this.audioSource != null) {
      this.audioSource.stop(0);
      // this.audioSource.disconnect(this.audioContext.destination);
      this.audioSource.disconnect(this.gainNode);
      // Leave existing source to garbage collection
      this.audioSource = null;
    }
  }

  startProgressTimer() {
    this.progressTimerID = window.setInterval(function() {
      var progress = this.state.progress;
      if (progress != null) {
        progress['played'] = (this.audioContext.currentTime - this.songStartTime);
        this.setState({
          progress: progress
        });
      }
    }.bind(this), 50);
  }

  stopProgressTimer() {
    if (this.progressTimerID != null) {
        window.clearInterval(this.progressTimerID);
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
    } else {
      this.playSong(index);
    }
  }
  togglePlayPause() {
      var play = this.state.isPlaying ? false : true;
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
      if( progress != null ) {
        progress['played'] = (this.audioContext.currentTime - this.songStartTime);
        this.setState({
          isPlaying: play,
          progress: progress
        });
      }
  }
  handleProgressClick(event) {
    // var percent = Math.round((event.clientX / window.outerWidth) * 100);

    var targetWidth = event.target.offsetWidth;
    var offsetClick = event.nativeEvent.offsetX;
    var percent = offsetClick / targetWidth;

    // var percent = (event.clientX / window.outerWidth);
    if( this.state.progress != null ) {
      var duration = this.state.progress.duration;
      var played = duration * percent;
      // this.audioSource.disconnect(this.audioContext.destination);
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

  /*
   * Retruns true if a child component is currently viewable
   *  inside the parent scrollable
   */
  isScrolledIntoView(parent, child) {
    var childTop = child.getBoundingClientRect().top;
    var childBottom = child.getBoundingClientRect().bottom;

    var parentTop = parent.getBoundingClientRect().top;
    var parentBottom = parent.getBoundingClientRect().bottom;

    var isVisible = (childTop >= parentTop) && (childBottom <= parentBottom);
    return isVisible;
  }

  playSong(index) {
    // Scroll to the active song if the song is not currently visible
    var playlistArray = document.getElementsByClassName("playlist");
    if( playlistArray != null && playlistArray.length == 1 ) {
      var playlist = playlistArray[0];
      var liArray = playlist.querySelectorAll("ul > li");
      if( liArray != null && liArray.length > index ) {
        if( !this.isScrolledIntoView( playlist, liArray[index] ) ) {
          liArray[index].scrollIntoView(false);
        }
      }
    }

    // Stop the current song and progress timer while we retrieve
    // the next song
    this.clearAudioSource();
      var song = this.state.songList[index];
      this.setState({currentSongIndex: index, isPlaying: true});

      //set the audio file's URL
      var audioURL = song.path;

      /*
       * A new song is being requested but we have not finished
       *  a previous request.
       * Cancel the previous request.
       */
      if( this.cancelAxios != null ) {
        this.cancelAxios();
      }
      this.cancelTokenSource = CancelToken.source();

      axios({
        method: 'get',
        url: audioURL,
        responseType: 'arraybuffer',
        cancelToken: new CancelToken(function executor(c) {
          this.cancelAxios = c;
        }.bind(this))
      })
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

              var bufferDuration = this.audioSource.buffer.duration;
              this.songStartTime = this.audioContext.currentTime;

              this.setState({
                  progress: {
                      played: 0,
                      duration: bufferDuration
                  }
              })
              // Check for 'running' here in case the context was previously suspended
              if (this.audioContext.state != 'running') {
                  this.audioContext.resume();
              }
              // Clear the cancel function because this request has finished
              this.cancelAxios = null;
          }.bind(this));
      }.bind(this))
      .catch(function(error) {
        this.cancelAxios = null;
        this.setState({isPlaying: false, progress: null});

        console.log("Error: " + error);
        if (axios.isCancel(error)) {
          console.log('Axios request was canceled', error.message);
        }

        this.stopProgressTimer();
        this.playNextSong();
      }.bind(this));
  }
  handleVolume(value) {
    if (value < 1) {
      var mute = this.state.mute ? false : true;
      var gainValue = mute ? 0 : this.state.volume;
      this.gainNode.gain.value = (gainValue / 100);
      this.setState({mute: mute});
    } else {
      this.gainNode.gain.value = (value / 100);
        this.setState({
          volume: value,
          mute: false
        });
    }
  }
  render() {
    return (
      <div className='player-wrapper'>
        <ControlPanel
          isPlaying={this.state.isPlaying}
          progress={this.state.progress}
          handleClick={this.handleControlClick}
          handleVolume={this.handleVolume}
          volume={this.state.mute ? 0 : this.state.volume}/>
        <ProgressBar progress={this.state.progress} handleClick={this.handleProgressClick} />
        <PlayList handleClick={this.handleSongClick} songs={this.state.songList} activeIndex={this.state.currentSongIndex} />
      </div>
    )
  }
}

module.exports = Player;
