<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ProseMirror</title>
    <style>
        #editor { border: 1px solid #ccc; padding: 10px; min-height: 120px; }
        .ProseMirror:focus { outline: none; }
    </style>
</head>
<body>
    <h1>ProseMirror</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <div id="editor"></div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script type="module">
        import { EditorState } from 'https://esm.sh/prosemirror-state@1'
        import { EditorView } from 'https://esm.sh/prosemirror-view@1'
        import { schema } from 'https://esm.sh/prosemirror-schema-basic@1'
        import { keymap } from 'https://esm.sh/prosemirror-keymap@1'
        import { baseKeymap } from 'https://esm.sh/prosemirror-commands@1'

        const initial = <?php echo json_encode($initial, JSON_UNESCAPED_UNICODE); ?>;
        const doc = initial
          ? schema.node('doc', null, initial.split(/\n{2,}/).map(p => p ? schema.node('paragraph', null, schema.text(p)) : schema.node('paragraph')))
          : undefined
        const state = EditorState.create({ schema, doc, plugins: [keymap(baseKeymap)] })
        const view = new EditorView(document.querySelector('#editor'), { state })
        window.__editor = view
        window.__editorContent = () => view.state.doc.textContent
        window.__editorReady = true
    </script>
    <script>
        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : ''
        })
    </script>
</body>
</html>
