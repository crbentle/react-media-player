var React = require('react');
var PropTypes = require('prop-types');

  class Player extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        progress: 0
      }

    this.handledClick = this.handledClick.bind(this);
    }
    handledClick (event) {
      var percent = Math.round( ( event.clientX / window.outerWidth) * 100 );
      this.setState(
        {progress: percent}
      )
    }
    render() {
    var style = {
      width: this.state.progress+'%'
    };
      return (
        <div>
          <div className='player'>
            Player
          </div>
          {/* $("#test").mousemove(function(e){
            var perc = e.offsetX/ $(this).width() * 100;
            $(this).html(e.offsetX + " | " + perc + " perc");
          }); */}
          <div onClick={this.handledClick} className='progress'>
            <div style={style} className='progress-played'>
            </div>
            <div className='progress-remaining'></div>
          </div>
        </div>
      )
    }
}

module.exports = Player;
