<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Base UI Combobox (inline input)</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        label { display: block; font-weight: bold; margin-bottom: 5px; }
        input[role="combobox"] { width: 250px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
        .Popup { background: #fff; border: 1px solid #ccc; border-radius: 4px; padding: 6px; min-width: 250px; box-shadow: 0 4px 12px rgba(0,0,0,.15); }
        [role="option"] { padding: 8px; cursor: pointer; }
        [role="option"][data-highlighted] { background: #e8e8e8; }
    </style>
    <script type="importmap">
    {"imports": {
      "react": "https://esm.sh/react@19.2.0",
      "react/jsx-runtime": "https://esm.sh/react@19.2.0/jsx-runtime",
      "react-dom": "https://esm.sh/react-dom@19.2.0",
      "react-dom/client": "https://esm.sh/react-dom@19.2.0/client"
    }}
    </script>
</head>
<body>
    <h1>Base UI Combobox (inline input)</h1>
    <form id="combobox-form" method="post" action="/richtext_submit">
        <input type="text" id="outer-title" placeholder="Outer title">
        <div id="root"></div>
        <button type="submit" id="submit">Submit</button>
    </form>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { Combobox } from 'https://esm.sh/@base-ui-components/react@1.0.0-rc.0/combobox?external=react,react-dom'
        import { Field } from 'https://esm.sh/@base-ui-components/react@1.0.0-rc.0/field?external=react,react-dom'

        const h = React.createElement
        const countries = ['United Kingdom', 'United States', 'Ukraine', 'Portugal', 'France', 'Germany']
        const initial = <?php echo json_encode($initial, JSON_UNESCAPED_UNICODE); ?>

        function App() {
            return h(Field.Root, null,
                h(Field.Label, null, 'Country'),
                h(Combobox.Root, { items: countries, name: 'content', defaultValue: initial || null },
                    h(Combobox.Input, { placeholder: 'e.g. United Kingdom' }),
                    h(Combobox.Portal, null,
                        h(Combobox.Positioner, { sideOffset: 4 },
                            h(Combobox.Popup, { className: 'Popup' },
                                h(Combobox.List, null, item => h(Combobox.Item, { key: item, value: item }, item)))))))
        }

        createRoot(document.getElementById('root')).render(h(App))

        window.__comboValue = () => document.querySelector('input[name="content"]').value
        window.__ready = true
    </script>
</body>
</html>
