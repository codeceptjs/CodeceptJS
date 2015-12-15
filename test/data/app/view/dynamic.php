<html>
<body>

<div id="text">Static text</div>

<script>
  setTimeout(function () {
    document.querySelector('#text').textContent = 'Dynamic text';
  }, 1000);
</script>
</body>
</html>
