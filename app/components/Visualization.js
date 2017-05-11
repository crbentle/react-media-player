import React from 'react';
import PropTypes from 'prop-types';

class Visualization extends React.Component {
  constructor(props) {
    super(props);
    this.frequencyData = new Uint8Array(this.props.analyserNode.frequencyBinCount);
    this.visualizationDataType = "ByteFrequency";

    this.drawByteFrequencyData = this.drawByteFrequencyData.bind(this);
    this.drawByteFrequencyStereoData = this.drawByteFrequencyStereoData.bind(this);
    this.drawByteTimeDomainData = this.drawByteTimeDomainData.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  updateCanvas() {
    if (this.canvas != null) {
      const ctx = this.canvas.getContext('2d');

      if (!this.props.isPlaying) {
        // TODO: slowly reduce frequncy bars
        //this.frequencyData = new Uint8Array(this.props.analyserNode.frequencyBinCount);
      } else {
        switch (this.visualizationDataType) {
          case "ByteFrequency":
            // display frequencyData
            this.drawByteFrequencyData(ctx);
            break;
          case "ByteFrequencyStereo":
            // display frequencyData
            this.drawByteFrequencyStereoData(ctx);
            break;
            // case "ByteTimeDomain":
            //   // display ByteTimeDomainData
            //   this.drawByteTimeDomainData( ctx );
            //   break;
          default:
            // Do nothing
        }
      }
    }
  }

  drawByteFrequencyData( ctx ) {

    this.props.analyserNode.getByteFrequencyData(this.frequencyData);
    var width = this.canvas.width;
    var height = this.canvas.height;

    // The highest frequncy value is 255. Determine how that correlates to the canvas height
    var heightFactor = height / 255;
    // The percentage of the canvas to use (there will be (1-heightBuffer)*100% space left empty above the graph)
    var heightBuffer = .9;
    // The highest frequncies don't typically have much data in recordings
    // By making each bar wider we can push the last frequncies off the canvas to hide them
    var widthClipping = 1.8;

    // subtract 1 to give room for a 1px padding between bars
    var barWidth = ( ( width / this.frequencyData.length ) - 1) * widthClipping;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.45)';
    ctx.fillRect(0, 0, width, height);

    // Loop through each frequncy and draw a bar for it
    this.frequencyData.forEach(function (item, index) {

      // Set the RGB value of the bar for the current frequncy
      // The red value will increase as the volume of the frequncy gets louder (minimum value of 50)
      // The green value will always be 0
      // The blue value will increase as the volume of the frequncy gets quieter
      ctx.fillStyle = 'rgb(' + Math.max( item, 50) + ',0,' + ( 255 - item ) + ')';

      // Alternative fill styles
      // ctx.fillStyle = 'rgb(' + ((item + 100) - index) + ',0,' + ((index * 2)) + ')';
      // ctx.fillStyle = 'rgb(' + Math.min( Math.max( item - (index*1), 0 ), 255 ) + ',0,' + Math.min( (index * 1.5), 255 ) + ')';
      // ctx.fillStyle = 'rgb(' + Math.max( ( item ), 100 ) + ',0,' + Math.min( index * 2, 255 ) + ')';
      //ctx.fillStyle = 'rgb(' + Math.max( ( item ), 0 ) + ',0,' + Math.max( ( 255 - item ), 0 ) + ')';
      // ctx.fillStyle = 'rgb(' + (item+100) + ',50,50)';
      // ctx.fillStyle = 'rgb(' + (item+100) + ',50,'+ ( (barWidth * index)  ) +')';

      // Use this to display a 2-sided graph
      // ctx.fillRect( ( (barWidth + 1) * index), (height-item)*.5, barWidth, item );

      // multiply height by fraction to increase inner padding
      var barHeight = item * heightFactor;
      ctx.fillRect( ( ( barWidth + 1 ) * index ), ( height - barHeight * heightBuffer ), barWidth, barHeight * heightBuffer );
    });

  }

  drawByteFrequencyStereoData(ctx) {
    this.props.analyserNode.getByteFrequencyData(this.frequencyData);
    var width = this.canvas.width;
    var height = this.canvas.height;

    // The highest frequncy value is 255. Determine how that correlates to the canvas height
    var heightFactor = height / 255;

    // The percentage of the canvas to use (there will be (1-heightBuffer)*100% space left empty above the graph)
    var heightBuffer = .9;

    // The highest frequncies don't typically have much data in recordings
    // By making each bar wider we can push the last frequncies off the canvas to hide them
    var widthClipping = 1.8;

    // subtract 1 to give room for a 1px padding between bars
    var barWidth = ((width / this.frequencyData.length)) * widthClipping;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.45)';
    ctx.fillRect(0, 0, width, height);

    // Loop through each frequncy and draw a bar for it
    this.frequencyData.forEach(function (item, index) {

      // Set the RGB value of the bar for the current frequncy
      // The red value will increase as the volume of the frequncy gets louder (minimum value of 50)
      // The green value will always be 0
      // The blue value will increase as the volume of the frequncy gets quieter
      ctx.fillStyle = 'rgb(' + Math.max(item, 50) + ',0,' + (255 - item) + ')';

      // multiply height by fraction to increase inner padding
      var barHeight = item * heightFactor * heightBuffer;

      // Use this to display a 2-sided graph
      ctx.fillRect(((barWidth) * index), (height - barHeight) * .5, barWidth, barHeight);
    });
  }

  drawByteTimeDomainData(ctx) {
    this.props.analyserNode.getByteTimeDomainData(this.frequencyData);

    var width = this.canvas.width;
    var height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.45)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';

    // The highest frequncy value is 255. Determine how that correlates to the canvas height
    var heightFactor = height / 255;
    var barWidth = ((width / this.frequencyData.length)) * 2;

    // Loop through each chunk and draw a bar for it
    this.frequencyData.forEach(function (item, index) {
      var value = item * heightFactor * 1.25;
      var y = height - (value) - 1;
      ctx.fillRect(index * barWidth, y, barWidth, 1);

    });
  }

  handleClick() {
    this.visualizationDataType = ( this.visualizationDataType == "ByteFrequency" ? "ByteFrequencyStereo" : "ByteFrequency" );
  }

  render() {
    this.updateCanvas();
    return (
      <section id="visualization">
        <canvas
          id="canvas"
          onClick={this.handleClick}
          ref={function (el) {
              this.canvas = el;
          }.bind(this)}
        />
      </section>
    );
  }

}

Visualization.propTypes = {
  analyserNode: PropTypes.object,
  isPlaying: PropTypes.bool.isRequired
};

module.exports = Visualization;
