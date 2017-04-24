var React = require('react');
const Player = require('./Player');

class App extends React.Component {
  render() {
    return (
      <div>
        <Player/>
      </div>
    );
  }
}

module.exports = App;
