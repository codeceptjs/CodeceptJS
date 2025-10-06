/**
 * Converted from HTML to pure JavaScript.
 * This file demonstrates adding an element to the DOM after a delay.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dynamic Element Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }
        #linkContext a {
            cursor: pointer;
            color: blue;
            text-decoration: underline;
        }
        #output {
            margin-top: 20px;
            font-weight: bold;
            font-size: 1.2em;
        }
    </style>
</head>
<body>

<h2>Dynamic Element Demo</h2>
<p>A "Hello world" link will appear below after a 2-second delay.</p>

<div id="context"></div>
<div id="output"></div>

<script>
  // Create a new div element in memory
  var newDiv = document.createElement("div");
  newDiv.innerHTML = "<a onclick='print()' id='click'>Hello world</a>";
  newDiv.id = "linkContext";

  // After a 2-second delay, add the new div to the page
  setTimeout(function () {
    document.getElementById('context').appendChild(newDiv);
  }, 2000);

  // This function is called when the new link is clicked
  function print() {
    document.getElementById('output').innerText = 'Hi!';
  }
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
    console.log('✅ Dynamic Element demo view running at http://127.0.0.1:8100')
  })
