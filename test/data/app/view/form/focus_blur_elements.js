/**
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing focus and blur events.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html>
<head>
    <title>Test Focus and Blur</title>
    <style>
        body {
            font-family: sans-serif;
        }
        .message {
            display: inline-block;
            margin-left: 10px;
            color: #555;
        }
    </style>
</head>
<body>

<h2>Focus & Blur Event Demo</h2>

<button id="button">Button</button>
<span id="buttonMessage" class="message">Button not focused</span>

<br/><br/>

<input type="text" id="field" placeholder="Type Here">
<span id="fieldMessage" class="message">Input field not focused</span>

<br/><br/>

<textarea id="textarea" placeholder="Write Here"></textarea>
<span id="textareaMessage" class="message">Textarea not focused</span>

<script>
  document.getElementById('button').addEventListener('focus', function() {
    document.getElementById('buttonMessage').innerText = '✅ Button is focused';
  });

  document.getElementById('button').addEventListener('blur', function() {
    document.getElementById('buttonMessage').innerText = 'Button not focused';
  });

  document.getElementById('field').addEventListener('focus', function() {
    document.getElementById('fieldMessage').innerText = '✅ Input field is focused';
  });

  document.getElementById('field').addEventListener('blur', function() {
    document.getElementById('fieldMessage').innerText = 'Input field not focused';
  });

  document.getElementById('textarea').addEventListener('focus', function() {
    document.getElementById('textareaMessage').innerText = '✅ Textarea is focused';
  });

  document.getElementById('textarea').addEventListener('blur', function() {
    document.getElementById('textareaMessage').innerText = 'Textarea not focused';
  });
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
    console.log('✅ Focus and Blur demo view running at http://127.0.0.1:8100')
  })
