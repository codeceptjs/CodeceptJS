<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Monaco</title>
</head>
<body>
    <h1>Monaco</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <div id="editor" style="height: 300px; border: 1px solid #ccc;"></div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
    <script>
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
        require(['vs/editor/editor.main'], function () {
            const initial = <?php echo json_encode($initial, JSON_UNESCAPED_UNICODE); ?>;
            const editor = monaco.editor.create(document.getElementById('editor'), {
                value: initial,
                language: 'plaintext',
                automaticLayout: true
            });
            window.__editor = editor;
            window.__editorContent = () => editor.getValue();
            window.__editorReady = true;
        });
        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
    </script>
</body>
</html>
