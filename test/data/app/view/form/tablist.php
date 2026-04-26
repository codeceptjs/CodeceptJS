<!doctype html>
<html>
  <head>
    <title>Tablist click regression (#5530)</title>
    <style>
      ul[role="tablist"] { display: flex; list-style: none; padding: 0; margin: 0; border-bottom: 1px solid #ccc; }
      ul[role="tablist"] li[role="tab"] { padding: 8px 16px; cursor: pointer; }
      ul[role="tablist"] li[aria-selected="true"] { background: #eef; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>Tablist</h1>
    <ul role="tablist" id="tabs" class="tab-list">
      <li role="tab" data-tab="description" aria-selected="true"><span class="tab-text">Description</span></li>
      <li role="tab" data-tab="code" aria-selected="false"><span class="tab-text">Code template</span></li>
      <li role="tab" data-tab="attachments" aria-selected="false"><span class="tab-text">Attachments</span></li>
      <li role="tab" data-tab="runs" aria-selected="false"><span class="tab-text">Runs</span></li>
      <li role="tab" data-tab="history" aria-selected="false"><span class="tab-text">History</span></li>
    </ul>
    <div id="selected-tab">description</div>
    <script>
      document.querySelectorAll('[role="tab"]').forEach(function (li) {
        li.addEventListener('click', function () {
          document.querySelectorAll('[role="tab"]').forEach(function (x) {
            x.setAttribute('aria-selected', 'false');
          });
          li.setAttribute('aria-selected', 'true');
          document.getElementById('selected-tab').textContent = li.dataset.tab;
        });
      });
    </script>
  </body>
</html>
