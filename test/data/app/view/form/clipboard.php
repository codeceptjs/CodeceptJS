<html>
<body>
<h1>Clipboard</h1>
<input type="text" id="source" value="Copy me" />
<button id="copy">Copy to clipboard</button>
<div id="status"></div>
<script>
document.getElementById('copy').addEventListener('click', function () {
  navigator.clipboard.writeText(document.getElementById('source').value).then(function () {
    document.getElementById('status').innerHTML = 'copied';
  }, function (err) {
    document.getElementById('status').innerHTML = 'failed: ' + err.message;
  });
});
</script>
</body>
</html>
