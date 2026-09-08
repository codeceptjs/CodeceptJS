<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Base UI Menu</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .row { margin: 12px 0; }
        .menu-content { background: #fff; border: 1px solid #666; padding: 4px; min-width: 200px; }
        .menu-content [role^="menuitem"] { padding: 4px 8px; cursor: pointer; }
        .menu-content [role^="menuitem"][aria-checked="true"] { background: #2a6; color: #fff; }
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
    <h1>Base UI Menu</h1>
    <div id="root"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { Menu } from 'https://esm.sh/@base-ui/react@1.8.0/menu?external=react,react-dom'

        const h = React.createElement

        function App() {
            const [statusBar, setStatusBar] = React.useState(false)
            const [activity, setActivity] = React.useState(false)
            const [person, setPerson] = React.useState('pedro')
            React.useEffect(() => { window.__ready = true }, [])
            return h(Menu.Root, null,
                h(Menu.Trigger, { className: 'row' }, 'Open menu'),
                h(Menu.Portal, null,
                    h(Menu.Positioner, null,
                        h(Menu.Popup, { className: 'menu-content' },
                            h(Menu.CheckboxItem, { className: 'ctl-status-bar', checked: statusBar, onCheckedChange: setStatusBar }, 'Show status bar'),
                            h(Menu.CheckboxItem, { className: 'ctl-activity-bar', checked: activity, onCheckedChange: setActivity }, 'Show activity bar'),
                            h(Menu.RadioGroup, { value: person, onValueChange: setPerson },
                                h(Menu.RadioItem, { value: 'pedro', className: 'ctl-pedro' }, 'Pedro Duarte'),
                                h(Menu.RadioItem, { value: 'colm', className: 'ctl-colm' }, 'Colm Tuite'))))))
        }

        createRoot(document.getElementById('root')).render(h(App))
    </script>
</body>
</html>
