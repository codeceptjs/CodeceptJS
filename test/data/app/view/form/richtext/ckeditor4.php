<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CKEditor 4</title>
</head>
<body>
    <h1>CKEditor 4</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <div id="editor">
            <textarea id="editor-inner"><?php echo htmlspecialchars($initial, ENT_QUOTES | ENT_HTML5, 'UTF-8'); ?></textarea>
        </div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://cdn.ckeditor.com/4.22.1/standard/ckeditor.js"></script>
    <script>
        CKEDITOR.replace('editor-inner');
        CKEDITOR.on('instanceReady', function(e) {
            window.__editor = e.editor;
            window.__editorContent = () => {
                const div = document.createElement('div');
                div.innerHTML = e.editor.getData() || '';
                return (div.textContent || '').replace(/\u00a0/g, ' ').trim();
            };
            window.__editorReady = true;
        });
        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
    </script>
</body>
</html>
