const React = require('react');
const songApi = require('../utils/songApi');
const PlayList = require('./PlayList');
const ControlPanel = require('./ControlPanel');
const ProgressBar = require('./ProgressBar');
const Visualization = require('./Visualization');
const axios = require('axios');
var CancelToken = axios.CancelToken;
var shuffle = require('shuffle-array');

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: null,
      currentSongIndex: -1,
      shuffle: false,
      isPlaying: false,
      volume: 100,
      mute: false
    };

    if( !this.songList ) {
      this.songList = songApi.getSongList();
      this.shuffleList = shuffle( this.songList, {'copy': true});
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
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
// this.analyserNode.minDecibels = -90;
// this.analyserNode.maxDecibels = -10;
this.analyserNode.smoothingTimeConstant = 0.8;
    this.analyserNode.connect(this.gainNode);

    /*
     * A method that can cancel a request if a new request comes in
     *  before the previous one finished.
     * This would happen if the previos or next buttons were clicked
     *  faster than the requests are finishing.
    */
    this.cancelAxios;

    // Add keyboard controls
    window.onkeydown = function (e) {
      var code = e.keyCode ? e.keyCode : e.which;
      if (code === 37) { //left arrow
        //previous
        this.playNextSong( -1 );
      } else if (code === 39) { //right arrow
        //next
        this.playNextSong( 1 );
      } else if (code === 32) { //spacebar
        //toggle
        e.preventDefault();
        this.togglePlayPause();
      }
    }.bind(this);
  }

  // Create a new AudioBufferSourceNode
  initAudioSource() {
    this.clearAudioSource();
    this.audioSource = this.audioContext.createBufferSource();
    this.audioSource.buffer = this.audioBuffer;
    // this.audioSource.connect(this.audioContext.destination);
    this.audioSource.connect(this.analyserNode);
    // Bind the callback to this
    this.audioSource.onended = this.playNextSong.bind(this, 1); //endOfPlayback;
    this.startProgressTimer();
  }

  clearAudioSource() {
    this.stopProgressTimer();

    // Clear any existing audio source that we might be using
    if (this.audioSource != null) {
      this.audioSource.stop(0);
      // this.audioSource.disconnect(this.audioContext.destination);
      this.audioSource.disconnect(this.analyserNode);
      // Leave existing source to garbage collection
      this.audioSource = null;
    }
  }

  startProgressTimer() {
    this.progressTimerID = window.setInterval(function () {
      var progress = this.state.progress;
      if (progress != null) {
        progress['played'] = (this.audioContext.currentTime - this.songStartTime);
        this.setState({progress: progress});
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
        this.playNextSong( -1 );
        break;
      case 'next':
        this.playNextSong( 1 );
        break;
      case 'shuffle':
        // index = this.shuffleList.findIndex(x => x == song );
        this.setState({
          shuffle: !this.state.shuffle
        });
        break;
      default:
        //?
    }
  }
  playCurrentSong() {
    // If the 'play' button is clicked as the first action we need to set the current song index to '0'
    var currentSongIndex = this.state.currentSongIndex;
    if (currentSongIndex < 0) {
      currentSongIndex = 0;
    }
    this.playSong(currentSongIndex);
  }
  playNextSong(direction) {
    var currentSongIndex = this.state.currentSongIndex;
    var nextIndex;
    // If we are in shuffle mode find the current song in the
    // shuffle list and move to the next song in the shuffle list
    if (this.state.shuffle) {
      var currentSong = this.songList[currentSongIndex];
      // Find the current song in the shuffle list so we never shuffle and play a duplicate
      var currentIndex = this.shuffleList.findIndex( x => x == currentSong );
      nextIndex = +currentIndex + +direction;
      if (nextIndex > this.shuffleList.length - 1) {
        nextIndex = 0;
      } else if (nextIndex < 0) {
        nextIndex = this.shuffleList.length - 1;
      }
      // Find the index on the songList that corresponds to the index in the shuffle list
      nextIndex = this.songList.findIndex( x => x == this.shuffleList[nextIndex] );
    } else {
        nextIndex = currentSongIndex + direction;
        if (nextIndex > this.songList.length - 1) {
          nextIndex = 0;
        } else if (nextIndex < 0) {
          nextIndex = this.songList.length - 1;
        }
    }
    this.playSong(nextIndex);
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
    if (progress != null) {
      progress['played'] = (this.audioContext.currentTime - this.songStartTime);
      this.setState({isPlaying: play, progress: progress});
    }
  }
  handleProgressClick(event) {
    // var percent = Math.round((event.clientX / window.outerWidth) * 100);

    var targetWidth = event.target.offsetWidth;
    var offsetClick = event.nativeEvent.offsetX;
    var percent = offsetClick / targetWidth;

    // var percent = (event.clientX / window.outerWidth);
    if (this.state.progress != null) {
      var duration = this.state.progress.duration;
      var played = duration * percent;
      // this.audioSource.disconnect(this.audioContext.destination);
      this.initAudioSource();
      this.audioSource.start(0, played);
      this.songStartTime = this.audioContext.currentTime - played;

      this.setState({
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
    if (playlistArray != null && playlistArray.length == 1) {
      var playlist = playlistArray[0];
      var liArray = playlist.querySelectorAll("ul > li");
      if (liArray != null && liArray.length > index) {
        if (!this.isScrolledIntoView(playlist, liArray[index])) {
          liArray[index].scrollIntoView(false);
        }
      }
    }

    // Stop the current song and progress timer while we retrieve
    // the next song
    this.clearAudioSource();
    var song = this.songList[index];
    this.setState({currentSongIndex: index, isPlaying: true});

    //set the audio file's URL
    var audioURL = song.path;

    /*
       * A new song is being requested but we have not finished
       *  a previous request.
       * Cancel the previous request.
       */
    if (this.cancelAxios != null) {
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
    }).then(function (response) {
      //take the audio from http request and decode it in an audio buffer
      this.audioBuffer = null;
      this.audioContext.decodeAudioData(response.data, function (audioBuffer) {

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
        });
        // Check for 'running' here in case the context was previously suspended
        if (this.audioContext.state != 'running') {
          this.audioContext.resume();
        }
        // Clear the cancel function because this request has finished
        this.cancelAxios = null;
      }.bind(this));
    }.bind(this)).catch(function (error) {
      this.cancelAxios = null;
      this.setState({isPlaying: false, progress: null});

      console.log("Error: " + error);
      if (axios.isCancel(error)) {
        console.log('Axios request was canceled', error.message);
      }

      this.stopProgressTimer();
      this.playNextSong( 1 );
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
      this.setState({volume: value, mute: false});
    }
  }
  render() {
    return (
      <div className='player-wrapper'>
        <ControlPanel
          isPlaying={this.state.isPlaying}
          shuffle={this.state.shuffle}
          progress={this.state.progress}
          handleClick={this.handleControlClick}
          handleVolume={this.handleVolume}
          volume={this.state.mute ? 0 : this.state.volume}/>
        <ProgressBar progress={this.state.progress} handleClick={this.handleProgressClick}/>
        { this.analyserNode &&
          <Visualization analyserNode={this.analyserNode} isPlaying={this.state.isPlaying} />
        }
        <PlayList handleClick={this.handleSongClick} songs={this.songList} activeIndex={this.state.currentSongIndex}/>
      </div>
    );
  }
}

module.exports = Player;
