<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Base UI Checkables</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .row { margin: 12px 0; display: flex; align-items: center; gap: 8px; }
        label { font-weight: bold; }
        span[role="checkbox"], span[role="radio"] { display: inline-block; width: 20px; height: 20px; border: 1px solid #666; background: #fff; border-radius: 3px; }
        span[role="checkbox"][data-checked], span[role="radio"][data-checked] { background: #2a6; }
        span[role="switch"] { display: inline-block; width: 42px; height: 22px; border: 1px solid #666; background: #ddd; border-radius: 11px; }
        span[role="switch"][data-checked] { background: #2a6; }
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
    <h1>Base UI Checkables</h1>
    <div id="root"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { Checkbox } from 'https://esm.sh/@base-ui/react@1.8.0/checkbox?external=react,react-dom'
        import { Switch } from 'https://esm.sh/@base-ui/react@1.8.0/switch?external=react,react-dom'
        import { Radio } from 'https://esm.sh/@base-ui/react@1.8.0/radio?external=react,react-dom'
        import { RadioGroup } from 'https://esm.sh/@base-ui/react@1.8.0/radio-group?external=react,react-dom'

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
                h(RadioGroup, { defaultValue: 'default', 'aria-label': 'Density' },
                    h('div', { className: 'row' },
                        h(Radio.Root, { value: 'default', id: 'r-default', className: 'ctl-default' }, h(Radio.Indicator, null)),
                        h('label', { htmlFor: 'r-default' }, 'Default')),
                    h('div', { className: 'row' },
                        h(Radio.Root, { value: 'comfortable', id: 'r-comfortable', className: 'ctl-comfortable' }, h(Radio.Indicator, null)),
                        h('label', { htmlFor: 'r-comfortable' }, 'Comfortable'))))
        }

        createRoot(document.getElementById('root')).render(h(App))
    </script>
</body>
</html>
