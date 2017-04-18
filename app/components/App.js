var React = require('react');
var PropTypes = require('prop-types');
const Player = require('./Player');

class App extends React.Component {
    render() {
        return (
            <div>
              <Player />
            </div>
        )
    }
}

module.exports = App;;
