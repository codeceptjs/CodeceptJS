<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ACE</title>
</head>
<body>
    <h1>ACE</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <div id="editor" style="height: 300px; border: 1px solid #ccc;"></div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://cdn.jsdelivr.net/npm/ace-builds@1.32.7/src-noconflict/ace.js"></script>
    <script>
        const editor = ace.edit('editor');
        const initial = <?php echo json_encode($initial, JSON_UNESCAPED_UNICODE); ?>;
        editor.setValue(initial, -1);
        window.__editor = editor;
        window.__editorContent = () => editor.getValue();
        window.__editorReady = true;

        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
    </script>
</body>
</html>
