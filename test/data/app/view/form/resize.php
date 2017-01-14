<html>
<body>
<script type="text/javascript">
function printWindowSize() {
  document.getElementById('height').innerText = 'Height '+ window.outerHeight;
  document.getElementById('width').innerText = 'Width '+ window.outerWidth;
}
</script>

<div>
    <button onclick="printWindowSize()">Window Size</button>
    <div id="height"></div>
    <div id="width"></div>
</div>




</body>
</html>
