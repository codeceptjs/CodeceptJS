/**
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing a range slider.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Range Slider Demo</title>
    <style>
      body {
        font-family: sans-serif;
        padding: 20px;
      }
      #slidecontainer {
        width: 100%;
        max-width: 500px; /* Limit width for better appearance */
      }
      .slider {
        -webkit-appearance: none; /* Override default CSS */
        appearance: none;
        width: 100%;
        height: 25px;
        background: #d3d3d3;
        outline: none;
        opacity: 0.7;
        -webkit-transition: .2s;
        transition: opacity .2s;
      }
      .slider:hover {
        opacity: 1; /* Fully visible on hover */
      }
      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 25px;
        height: 25px;
        background: #04AA6D; /* Green handle */
        cursor: pointer;
      }
      .slider::-moz-range-thumb {
        width: 25px;
        height: 25px;
        background: #04AA6D;
        cursor: pointer;
      }
    </style>
</head>
<body>

<h2>Range Slider Example</h2>

<div id="slidecontainer">
  <input
    type="range"
    min="1"
    max="100"
    value="50"
    class="slider"
    id="mySlider"
  />
</div>
<div>
    <h3>Value: <span id="demo"></span></h3>
</div>

<script>
  var slider = document.getElementById("mySlider");
  var output = document.getElementById("demo");
  output.innerHTML = slider.value; // Display the default slider value

  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
    output.innerHTML = this.value;
  };
<\/script>

</body>
</html>`

// Run a simple local server to serve this HTML
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Range Slider demo view running at http://127.0.0.1:8100')
  })
