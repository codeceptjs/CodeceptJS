/**
 * popupsDemo.js
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing browser popups (alert, confirm).
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Popups Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }
        #result {
            margin-top: 20px;
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
        }
    </style>
</head>
<body>

<h1>Watch our popups</h1>

<script type="text/javascript">
    function showConfirm() {
        var res = confirm("Are you sure?");
        var el = document.getElementById('result');
        if (res) {
            el.innerHTML = 'You clicked: Yes 👍';
        } else {
            el.innerHTML = 'You clicked: No 👎';
        }
    }

    function showAlert()
    {
        alert("This is an alert box!");
        document.getElementById('result').innerHTML = 'Alert was acknowledged.';
    }
</script>

<div>
    <button onclick="showConfirm()">Confirm</button>
    <button onclick="showAlert()">Alert</button>

    <div id="result"></div>
</div>

</body>
</html>`

// Run a simple local server to serve this HTML
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Popups demo view running at http://127.0.0.1:8100')
  })
