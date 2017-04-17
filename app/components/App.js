var React = require('react');
var PropTypes = require('prop-types');
var songApi = require('../utils/songApi');
const PlayList = require('./PlayList');
const Player = require('./Player');

class App extends React.Component {
    render() {
        return (
            <div>
              <Player />
              <PlayList songs={songApi.getSongList()} />
            </div>
        )
    }
}

module.exports = App;;
