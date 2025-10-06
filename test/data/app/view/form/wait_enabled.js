/**
 * Converted from HTML to pure JavaScript.
 * This file demonstrates elements being enabled after a delay.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Enable Elements Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }
        input, button {
            display: block;
            margin-bottom: 15px;
            padding: 5px;
        }
        #message {
            font-weight: bold;
            margin-top: 10px;
            color: green;
        }
        input:disabled, button:disabled {
            background-color: #f0f0f0;
            color: #999;
            cursor: not-allowed;
        }
    </style>
</head>
<body>

<h2>Enable Elements After Delay</h2>
<p>The input field and button will be enabled after 1 second.</p>

<input id="text" type="text" name="test" disabled="true" value="some text">

<button id="button" type="button" name="button1" disabled="true" value="first" onclick="updateMessage('button was clicked')">A Button</button>

<div id="message"></div>

<script>
  setTimeout(function () {
    document.querySelector('#text').disabled = false;
    document.querySelector('#button').disabled = false;
  }, 1000);

  function updateMessage(msg) {
    document.querySelector('#message').textContent = msg;
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
    console.log('✅ Enable Elements demo view running at http://127.0.0.1:8100')
  })
