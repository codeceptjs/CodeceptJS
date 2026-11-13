<html>
<head>
<style>
#moving { margin-left: 0; transition: margin-left 3s linear; }
#moving.go { margin-left: 300px; }
#spinning { animation: slide 3s linear; }
@keyframes slide { from { margin-left: 0; } to { margin-left: 300px; } }
</style>
</head>
<body>
<button id="moving" onclick="window.clicked = true">Moving</button>
<div id="spinning">Spinning</div>
<script>
window.ev = [];
document.addEventListener('transitionend', function () { window.ev.push('transitionend') });
document.addEventListener('animationend', function () { window.ev.push('animationend') });
requestAnimationFrame(function () { requestAnimationFrame(function () { document.getElementById('moving').className = 'go' }) });
</script>
</body>
</html>
