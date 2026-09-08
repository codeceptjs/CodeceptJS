<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Radix Menu</title>
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
    <h1>Radix Menu</h1>
    <div id="root"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { DropdownMenu } from 'https://esm.sh/radix-ui@1.6.7?external=react,react-dom'

        const h = React.createElement

        function App() {
            const [statusBar, setStatusBar] = React.useState(false)
            const [activity, setActivity] = React.useState(false)
            const [person, setPerson] = React.useState('pedro')
            React.useEffect(() => { window.__ready = true }, [])
            return h(DropdownMenu.Root, null,
                h(DropdownMenu.Trigger, { className: 'row' }, 'Open menu'),
                h(DropdownMenu.Portal, null,
                    h(DropdownMenu.Content, { className: 'menu-content' },
                        h(DropdownMenu.CheckboxItem, { className: 'ctl-status-bar', checked: statusBar, onCheckedChange: setStatusBar }, 'Show status bar'),
                        h(DropdownMenu.CheckboxItem, { className: 'ctl-activity-bar', checked: activity, onCheckedChange: setActivity }, 'Show activity bar'),
                        h(DropdownMenu.RadioGroup, { value: person, onValueChange: setPerson },
                            h(DropdownMenu.RadioItem, { value: 'pedro', className: 'ctl-pedro' }, 'Pedro Duarte'),
                            h(DropdownMenu.RadioItem, { value: 'colm', className: 'ctl-colm' }, 'Colm Tuite')))))
        }

        createRoot(document.getElementById('root')).render(h(App))
    </script>
</body>
</html>
