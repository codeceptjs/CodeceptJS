<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Radix Checkables</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .row { margin: 12px 0; display: flex; align-items: center; gap: 8px; }
        label { font-weight: bold; }
        button[role="checkbox"], button[role="radio"] { width: 20px; height: 20px; border: 1px solid #666; background: #fff; border-radius: 3px; }
        button[role="checkbox"][data-state="checked"], button[role="radio"][data-state="checked"] { background: #2a6; }
        button[role="switch"] { width: 42px; height: 22px; border: 1px solid #666; background: #ddd; border-radius: 11px; }
        button[role="switch"][data-state="checked"] { background: #2a6; }
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
    <h1>Radix Checkables</h1>
    <div id="root"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { Checkbox, Switch, RadioGroup } from 'https://esm.sh/radix-ui@1.6.7?external=react,react-dom'

        const h = React.createElement

        function App() {
            React.useEffect(() => { window.__ready = true }, [])
            return h('div', null,
                h('div', { className: 'row' },
                    h(Checkbox.Root, { id: 'terms', className: 'ctl-terms' }, h(Checkbox.Indicator, null)),
                    h('label', { htmlFor: 'terms' }, 'Accept terms')),
                h('div', { className: 'row' },
                    h(Switch.Root, { id: 'airplane', className: 'ctl-airplane' }, h(Switch.Thumb, null)),
                    h('label', { htmlFor: 'airplane' }, 'Airplane mode')),
                h(RadioGroup.Root, { defaultValue: 'default', 'aria-label': 'Density' },
                    h('div', { className: 'row' },
                        h(RadioGroup.Item, { value: 'default', id: 'r-default', className: 'ctl-default' }, h(RadioGroup.Indicator, null)),
                        h('label', { htmlFor: 'r-default' }, 'Default')),
                    h('div', { className: 'row' },
                        h(RadioGroup.Item, { value: 'comfortable', id: 'r-comfortable', className: 'ctl-comfortable' }, h(RadioGroup.Indicator, null)),
                        h('label', { htmlFor: 'r-comfortable' }, 'Comfortable'))))
        }

        createRoot(document.getElementById('root')).render(h(App))
    </script>
</body>
</html>
