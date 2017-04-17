var React = require('react');
var PropTypes = require('prop-types');
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;

class Song extends React.Component {
    render() {
        return (
            <li
              className={this.props.active ? 'active' : ''} onClick={this.props.songClick}
            >
              {this.props.title}
            </li>
        )
    }
}

class PlayList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeIndex: -1
        }

        this.songClick = this.songClick.bind(this);
    }
    songClick(index) {
        this.setState({activeIndex: index})
    }
    render() {
        return (
//           <div className='playlist'>
//   <ListGroup>
//        {this.props.songs.map(function(song, index) {
//         const active = this.state.activeIndex === index ? true : false;
//         return (
//           <ListGroupItem key={song.title} onClick={this.songClick.bind(this, index)}>{song.title}</ListGroupItem>
//
//         )
//       }, this)}
//   </ListGroup>
// </div>
            <ul className='playlist'>
              {this.props.songs.map(function(song, index) {
                const active = this.state.activeIndex === index ? true : false;
                return (
                  <Song
                    key={song.title}
                    title={song.title}
                    songClick={this.songClick.bind(this, index)} active={active}
                  />
                )
              }, this)}
            </ul>
        )
    }
}

module.exports = PlayList;
