<html>
<body>

<div id="text">Static text</div>

<script>
  setTimeout(function () {
    document.querySelector('#text').textContent = 'Timeout text';
  }, 30000);
</script>
</body>
</html>
