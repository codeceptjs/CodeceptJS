<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Trix</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/trix@2/dist/trix.css">
</head>
<body>
    <h1>Trix</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <input id="trix-input" type="hidden">
        <trix-editor input="trix-input"></trix-editor>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://cdn.jsdelivr.net/npm/trix@2/dist/trix.umd.min.js"></script>
    <script>
        document.addEventListener('trix-initialize', function(e) {
            const initial = <?php echo json_encode($initial, JSON_UNESCAPED_UNICODE); ?>;
            if (initial) e.target.editor.insertString(initial);
            window.__editor = e.target;
            window.__editorContent = () => e.target.innerText.replace(/\s+$/, '');
            window.__editorReady = true;
        });
        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
    </script>
</body>
</html>
