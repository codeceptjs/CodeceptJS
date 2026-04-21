<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CodeMirror 5</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.css">
    <style>.CodeMirror { border: 1px solid #ccc; height: 200px; }</style>
</head>
<body>
    <h1>CodeMirror 5</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <textarea id="editor"><?php echo htmlspecialchars($initial, ENT_QUOTES | ENT_HTML5, 'UTF-8'); ?></textarea>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.js"></script>
    <script>
        const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {});
        window.__editor = editor;
        window.__editorContent = () => editor.getValue();
        window.__editorReady = true;

        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
    </script>
</body>
</html>
