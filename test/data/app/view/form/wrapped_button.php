<html>
<body>
<ul>
    <li id="menu-item">
        <button type="button" id="menu-button" style="display:block;width:100%;height:30px"><span>New suite</span></button>
    </li>
</ul>
<div id="opened" style="display:none">opened</div>
<script>
  document.getElementById('menu-button').addEventListener('click', function () {
    document.getElementById('opened').style.display = 'block'
  })
</script>
</body>
</html>
