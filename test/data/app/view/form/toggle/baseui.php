<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Base UI Toggles</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .row { margin: 12px 0; display: flex; align-items: center; gap: 8px; }
        button { min-width: 90px; height: 28px; border: 1px solid #666; background: #fff; }
        button[aria-pressed="true"] { background: #2a6; color: #fff; }
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
    <h1>Base UI Toggles</h1>
    <div id="root"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { Toggle } from 'https://esm.sh/@base-ui/react@1.8.0/toggle?external=react,react-dom'
        import { ToggleGroup } from 'https://esm.sh/@base-ui/react@1.8.0/toggle-group?external=react,react-dom'

        const h = React.createElement

        function App() {
            React.useEffect(() => { window.__ready = true }, [])
            return h('div', null,
                h('div', { className: 'row' },
                    h(Toggle, { className: 'ctl-bold' }, 'Bold')),
                h(ToggleGroup, { toggleMultiple: true, className: 'row', 'aria-label': 'Text formatting' },
                    h(Toggle, { value: 'italic', className: 'ctl-italic' }, 'Italic'),
                    h(Toggle, { value: 'underline', className: 'ctl-underline' }, 'Underline')))
        }

        createRoot(document.getElementById('root')).render(h(App))
    </script>
</body>
</html>
