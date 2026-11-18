<html>
<body>
<div id="mousedown-trigger" tabindex="0" style="height:20px">open</div>
<div id="mousedown-menu" style="display:none">menu</div>
<button id="disabled-btn" disabled>off</button>
<script>
  window.__clickEvents = []
  var trigger = document.getElementById('mousedown-trigger')
  ;['pointerdown', 'mousedown', 'focus', 'pointerup', 'mouseup', 'click'].forEach(function (type) {
    trigger.addEventListener(type, function () { window.__clickEvents.push(type) })
  })
  trigger.addEventListener('mousedown', function () {
    document.getElementById('mousedown-menu').style.display = 'block'
  })
  document.getElementById('disabled-btn').addEventListener('mousedown', function () {
    window.__clickEvents.push('disabled-mousedown')
  })
</script>
</body>
</html>
