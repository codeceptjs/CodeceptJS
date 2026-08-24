<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CodeMirror 6</title>
    <style>#editor { border: 1px solid #ccc; }</style>
</head>
<body>
    <h1>CodeMirror 6</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <div id="editor"></div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script type="module">
        import { EditorView, minimalSetup } from '/js/codemirror6.js'
        const initial = <?php echo json_encode($initial, JSON_UNESCAPED_UNICODE); ?>;
        const view = new EditorView({
            doc: initial,
            parent: document.getElementById('editor'),
            extensions: [minimalSetup]
        });
        window.__editor = view;
        window.__editorContent = () => view.state.doc.toString();
        window.__editorReady = true;
    </script>
    <script>
        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
    </script>
</body>
</html>
