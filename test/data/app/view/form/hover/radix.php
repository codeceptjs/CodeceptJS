<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Radix Tooltip and Hover Card</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        button { padding: 10px 20px; margin: 20px 0; display: block; }
        .Content { background: #333; color: #fff; padding: 8px 12px; border-radius: 4px; }
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
    <h1>Radix Tooltip and Hover Card</h1>
    <div id="root"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { Tooltip, HoverCard } from 'https://esm.sh/radix-ui@1.6.7?external=react,react-dom'

        const h = React.createElement

        function App() {
            return h(React.Fragment, null,
                h(Tooltip.Provider, { delayDuration: 0 },
                    h(Tooltip.Root, null,
                        h(Tooltip.Trigger, { asChild: true }, h('button', null, 'Hover me')),
                        h(Tooltip.Portal, null,
                            h(Tooltip.Content, { className: 'Content', sideOffset: 5 }, 'Tooltip is open')))),
                h(HoverCard.Root, { openDelay: 0 },
                    h(HoverCard.Trigger, { asChild: true }, h('button', null, 'Hover card trigger')),
                    h(HoverCard.Portal, null,
                        h(HoverCard.Content, { className: 'Content', sideOffset: 5 }, 'Hover card is open'))))
        }

        createRoot(document.getElementById('root')).render(h(App))

        window.__ready = true
    </script>
</body>
</html>
