<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TinyMCE (inline)</title>
    <style>
        #editor { border: 1px solid #ccc; padding: 10px; min-height: 120px; }
    </style>
</head>
<body>
    <h1>TinyMCE (inline / contenteditable)</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <div id="editor"><?php echo htmlspecialchars($initial, ENT_QUOTES | ENT_HTML5, 'UTF-8'); ?></div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit" style="position: fixed; bottom: 20px; right: 20px; z-index: 99999;">Submit</button>
    </form>
    <script src="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js" referrerpolicy="origin"></script>
    <script>
        tinymce.init({
            selector: '#editor',
            inline: true,
            license_key: 'gpl',
            promotion: false,
            setup: function(editor) {
                editor.on('init', function() {
                    window.__editor = editor;
                    window.__editorContent = () => editor.getContent({ format: 'text' }).trim();
                    window.__editorReady = true;
                });
            }
        });
        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
    </script>
</body>
</html>
