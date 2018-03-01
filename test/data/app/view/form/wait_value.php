<html>
<body>

<input id="text" class="inputbox" type="text" name="test" value="Grüße aus Hamburg">
<input id="text2" class="inputbox" type="text" name="test2" value="Grüße aus London">

<script>
  setTimeout(function () {
    document.querySelector('#text').value = 'Hello from Brisbane';
  }, 2000);

  setTimeout(function () {
    document.querySelector('#text2').value = 'Hello from Brisbane';
  }, 4000);
</script>
</body>
</html>
