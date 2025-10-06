/**
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Multiple File Upload Form</title>
</head>
<body>
<form action="/form/complex" method="POST" enctype="multipart/form-data">
    <p>Select files to upload:</p>
    <div>
        <label for="foo">File 1:</label>
        <input type="file" name="foo" id="foo" />
    </div>
    <br>
    <div>
        <label for="foo_bar">File 2 (bar):</label>
        <input type="file" name="foo[bar]" id="foo_bar" />
    </div>
    <br>
    <div>
        <label for="foo_baz">File 3 (baz):</label>
        <input type="file" name="foo[baz]" id="foo_baz" />
    </div>
    <br>
    <div>
        <label for="xxx">Text Field:</label>
        <input type="text" name="xxx" id="xxx" />
    </div>
    <br>
    <input type="submit" name="Submit" value="Upload" />
</form>
</body>
</html>`

// Run a simple local server to serve this HTML
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Multiple file upload form view running at http://127.0.0.1:8100')
  })
