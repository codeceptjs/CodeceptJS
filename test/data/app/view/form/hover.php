<html>
<head></head>
<body>
<br>
<br><br><br><br><br><br><br><br><br><br>
<span id="hover" onmouseover="document.getElementById('show').innerText = 'Hovered!'">Hover me!</span>

<div id="show"></div>

<p>
  <button id="hover-button" onmouseover="document.getElementById('show-button').innerText = 'Button hovered!'">Show details</button>
</p>
<div id="show-button"></div>

<p>
  <span id="hover-card" aria-label="Hover card trigger" onmouseover="document.getElementById('show-card').innerText = 'Card hovered!'">?</span>
</p>
<div id="show-card"></div>

</body>
</html>
