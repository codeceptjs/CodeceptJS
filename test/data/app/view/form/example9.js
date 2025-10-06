/**
 * fileUploadForm.js
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>File Upload Form</title>
</head>
<body>
<form action="/form/complex" method="post" enctype="multipart/form-data" name="package_csv_form" class="form">
    <dl>
        <dd>
            <label>
                <span class="label">XLS file</span>
                <input type="hidden" name="MAX_FILE_SIZE" value="2097152" id="MAX_FILE_SIZE">
                <input type="file" name="xls_file" id="xls_file">
            </label>
        </dd>
    </dl>
    <dl>
        <dd class="last">
            <input type="hidden" name="form_name" value="package_csv_form" id="form_name">
            <input type="submit" name="submit" id="submit" value="Upload packages" class="submit">
            <a href="#" class="cancel_link">Cancel</a>
        </dd>
    </dl>
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
    console.log('✅ File upload form view running at http://127.0.0.1:8100')
  })
