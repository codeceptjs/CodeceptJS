<html>
<head>
<style>
body {
  margin: 0;
  padding: 20px;
}
#clickArea {
  width: 400px;
  height: 300px;
  background-color: #f0f0f0;
  border: 2px solid #333;
  position: relative;
  margin: 20px 0;
}
#output {
  font-family: monospace;
  margin-top: 20px;
}
</style>
<script>
let lastClickX = 0;
let lastClickY = 0;

function handleClick(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  lastClickX = event.clientX - rect.left;
  lastClickY = event.clientY - rect.top;

  document.getElementById('output').innerHTML =
    'Clicked at: X=' + Math.round(lastClickX) + ', Y=' + Math.round(lastClickY);
}

function handleGlobalClick(event) {
  lastClickX = event.clientX;
  lastClickY = event.clientY;

  document.getElementById('globalOutput').innerHTML =
    'Global click at: X=' + Math.round(lastClickX) + ', Y=' + Math.round(lastClickY);
}

window.addEventListener('load', function() {
  document.getElementById('clickArea').addEventListener('click', handleClick);
  document.body.addEventListener('click', handleGlobalClick);
});
</script>
</head>
<body>

<h1>Click Coordinates Test</h1>

<div id="clickArea">
  Click inside this area
</div>

<div id="output">No clicks yet</div>
<div id="globalOutput">No global clicks yet</div>

</body>
</html>
