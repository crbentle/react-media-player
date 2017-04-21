var React = require('react');
var PropTypes = require('prop-types');

function ProgressBar(props) {
    var style = {
      width: '0%'
    };
    if( props.progress != null ) {
      var percent = (props.progress.played / props.progress.duration) * 100;
      style = {
        width: percent + '%'
      };
    }
    return(
      <div onClick={props.handleClick} className='player-progress'>
        <div style={style != null ? style : null} className='progress-played'>
          <span className='progress-slider-disc'>
          </span>
        </div>
        <div className='progress-remaining'></div>
      </div>
    )
}

ProgressBar.PropTypes = {
  progress: PropTypes.shape({
    played: PropTypes.bool.isRequired,
    duration: PropTypes.number.isRequired
  }),
  handleClick: PropTypes.func.isRequired
}

module.exports = ProgressBar;
