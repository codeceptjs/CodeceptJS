<html><body>
<div id="droparea" style="width:300px;height:200px;border:2px dashed #ccc;padding:20px;">
  <p id="status">Drop files here</p>
</div>
<div id="file-list"></div>
<script>
  var droparea = document.getElementById('droparea');
  droparea.addEventListener('dragenter', function(e) { e.preventDefault(); });
  droparea.addEventListener('dragover', function(e) { e.preventDefault(); });
  droparea.addEventListener('drop', function(e) {
    e.preventDefault();
    var files = e.dataTransfer.files;
    document.getElementById('status').textContent = 'Dropped ' + files.length + ' file(s)';
    var list = document.getElementById('file-list');
    list.innerHTML = '';
    for (var i = 0; i < files.length; i++) {
      var div = document.createElement('div');
      div.className = 'file-info';
      div.textContent = files[i].name + ' - ' + files[i].type + ' - ' + files[i].size;
      list.appendChild(div);
    }
  });
</script>
</body></html>
