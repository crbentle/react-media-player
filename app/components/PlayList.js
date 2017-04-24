var React = require('react');
var PropTypes = require('prop-types');

class Song extends React.Component {
  render() {
    return (
      <li className={this.props.active ? 'active' : ''} onClick={this.props.songClick}>
        {this.props.title}
      </li>
    );
  }
}

Song.propTypes = {
  active: PropTypes.bool.isRequired,
  songClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};

class PlayList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeIndex: -1
    };

    this.songClick = this.songClick.bind(this);
  }
  songClick(index) {
    this.setState({activeIndex: index});
    this.props.handleClick(index);
  }
  render() {
    return (
      <div className='playlist'>
        <ul>
          {this.props.songs.map(
            function (song, index) {
              const active = this.props.activeIndex === index ? true : false;
              return (
                <Song
                  key={song.title}
                  title={song.title}
                  songClick={this.songClick.bind(this, index)}
                  active={active}/>
                );
              }, this)
            }
        </ul>
      </div>
    );
  }
}

PlayList.propTypes = {
  handleClick: PropTypes.func.isRequired,
  songs: PropTypes.arrayOf(PropTypes.shape({title: PropTypes.string.isRequired})),
  activeIndex: PropTypes.number.isRequired
};

module.exports = PlayList;
