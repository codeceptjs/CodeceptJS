import yaml from 'js-yaml'

// ─────────────────────────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────────────────────────

const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'textbox',
  'searchbox',
  'checkbox',
  'radio',
  'switch',
  'combobox',
  'listbox',
  'listitem',
  'menu',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'tab',
  'tabpanel',
  'slider',
  'spinbutton',
  'treeitem',
  'gridcell',
])

// Long groups of same-role siblings get summarised as: first N + "...M omitted..." + last N
const SIBLING_COLLAPSE_THRESHOLD = 50
const SIBLING_COLLAPSE_KEEP_EACH_SIDE = 5

// ─────────────────────────────────────────────────────────────────
// STEP 1 · Parse: YAML text → AriaNode[]
// ─────────────────────────────────────────────────────────────────

function unquote(value) {
  const v = value.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1)
  }
  return v
}

// Parse one YAML node label like:  `button "Save"`,  `textbox "Email" [focused]`,  `heading "Title" [level=2]`
function parseLabel(label) {
  if (!label) return null
  const trimmed = label.trim()
  const roleMatch = trimmed.match(/^(\w+)/)
  if (!roleMatch) return null
  const role = roleMatch[1].toLowerCase()
  let rest = trimmed.slice(roleMatch[0].length)

  let name
  const nameMatch = rest.match(/^\s*"((?:[^"\\]|\\.)*)"/) || rest.match(/^\s*'((?:[^'\\]|\\.)*)'/)
  if (nameMatch) {
    name = nameMatch[1]
    rest = rest.slice(nameMatch[0].length)
  }

  const attributes = {}
  const attrMatch = rest.match(/\[([^\]]*)\]/)
  if (attrMatch) {
    for (const tok of attrMatch[1].split(/[\s,]+/).filter(Boolean)) {
      const eq = tok.indexOf('=')
      if (eq === -1) {
        attributes[tok.toLowerCase()] = true
        continue
      }
      attributes[tok.slice(0, eq).trim().toLowerCase()] = unquote(tok.slice(eq + 1))
    }
  }

  return { role, name, attributes }
}

function yamlItemToNode(item) {
  if (typeof item === 'string') {
    const label = parseLabel(item)
    if (!label) return null
    const node = { role: label.role, name: label.name, attributes: label.attributes, children: [] }
    return node
  }
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null

  const entries = Object.entries(item)
  if (entries.length === 0) return null
  const [key, value] = entries[0]
  const label = parseLabel(key)
  if (!label) return null
  const node = { role: label.role, name: label.name, attributes: label.attributes, children: [] }

  if (Array.isArray(value)) {
    node.children = value.map(yamlItemToNode).filter(n => n !== null)
    return node
  }
  if (value !== null && value !== undefined) node.value = String(value)
  return node
}

function parseSnapshot(snapshot) {
  if (!snapshot) return []
  let parsed
  try {
    parsed = yaml.load(snapshot)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map(yamlItemToNode).filter(n => n !== null)
}

// ─────────────────────────────────────────────────────────────────
// STEP 2 · Transform: drop containers that contribute nothing.
// ─────────────────────────────────────────────────────────────────

function dropEmpty(nodes) {
  return nodes.flatMap(node => {
    const children = dropEmpty(node.children)
    if (INTERACTIVE_ROLES.has(node.role)) return [{ ...node, children }]
    if (children.length > 0) return [{ ...node, children }]
    return []
  })
}

// ─────────────────────────────────────────────────────────────────
// STEP 3 · Render: AriaNode[] → indented YAML text
// ─────────────────────────────────────────────────────────────────

// One-line representation of a node. Stable attr order so diff comparisons are deterministic.
function formatNode(node) {
  let line = node.role
  if (node.name && node.name.trim()) line += ` "${node.name.trim()}"`
  const attrParts = []
  for (const k of Object.keys(node.attributes).sort()) {
    const v = node.attributes[k]
    if (v === undefined || v === null || v === '') continue
    if (v === true) attrParts.push(k)
    else attrParts.push(`${k}=${v}`)
  }
  if (attrParts.length > 0) line += ` [${attrParts.join(' ')}]`
  if (node.value !== undefined && node.value !== null) {
    const text = String(node.value).trim()
    if (text) line += `: ${text}`
  }
  return line
}

// Group consecutive same-role siblings.  [a,a,b,a,a,a] → [[a,a],[b],[a,a,a]]
function groupByConsecutiveRole(nodes) {
  return nodes.reduce((groups, node) => {
    const last = groups[groups.length - 1]
    if (last && last[0].role === node.role) {
      last.push(node)
      return groups
    }
    groups.push([node])
    return groups
  }, [])
}

// Large group of same-role siblings → first N + placeholder line + last N.
// Returns mix of AriaNode (to render) and pre-rendered placeholder strings.
function collapseGroup(group, depth) {
  if (group.length <= SIBLING_COLLAPSE_THRESHOLD) return group
  const keep = SIBLING_COLLAPSE_KEEP_EACH_SIDE
  const omitted = group.length - keep * 2
  const placeholder = `${'  '.repeat(depth)}- ...${omitted} similar "${group[0].role}" items omitted...`
  return [...group.slice(0, keep), placeholder, ...group.slice(-keep)]
}

function renderTree(nodes, depth = 0) {
  const items = groupByConsecutiveRole(nodes).flatMap(group => collapseGroup(group, depth))
  return items
    .map(item => {
      if (typeof item === 'string') return item
      const indent = '  '.repeat(depth)
      const head = `${indent}- ${formatNode(item)}`
      if (item.children.length === 0) return head
      return `${head}:\n${renderTree(item.children, depth + 1)}`
    })
    .join('\n')
}

// ─────────────────────────────────────────────────────────────────
// STEP 4 · Diff: collect interactive summaries → bag diff → text
// ─────────────────────────────────────────────────────────────────

// Walk tree, emit one summary string per meaningful interactive node.
function collectSummaries(nodes) {
  return nodes.flatMap(node => {
    const fromChildren = collectSummaries(node.children)
    if (!INTERACTIVE_ROLES.has(node.role)) return fromChildren
    const summary = formatNode(node)
    if (summary === node.role) return fromChildren  // skip empty unnamed interactive nodes
    return [summary, ...fromChildren]
  })
}

function countBy(items) {
  return items.reduce((map, item) => {
    map.set(item, (map.get(item) ?? 0) + 1)
    return map
  }, new Map())
}

// Bag diff: any summary appearing more in one bag than the other becomes added/removed.
function diffSummaries(prev, curr) {
  const before = countBy(prev)
  const after = countBy(curr)
  const added = []
  const removed = []
  for (const summary of new Set([...before.keys(), ...after.keys()])) {
    const b = before.get(summary) ?? 0
    const a = after.get(summary) ?? 0
    for (let i = 0; i < a - b; i += 1) added.push(summary)
    for (let i = 0; i < b - a; i += 1) removed.push(summary)
  }
  return { added, removed }
}

function formatDiff(added, removed) {
  if (added.length === 0 && removed.length === 0) return null
  const lines = ['ariaDiff:']
  if (added.length === 0) {
    lines.push('  added: []')
  } else {
    lines.push('  added:')
    for (const [item, count] of [...countBy(added).entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const suffix = count > 1 ? ` (x${count})` : ''
      lines.push(`    - ${item}${suffix}`)
    }
  }
  if (removed.length === 0) {
    lines.push('  removed: []')
  } else {
    lines.push(`  removed: ${removed.length} interactive elements`)
  }
  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────
// Public API — pipelines composed visibly, top-to-bottom
// ─────────────────────────────────────────────────────────────────

function compactAriaSnapshot(snapshot) {
  if (!snapshot) return ''
  const tree = dropEmpty(parseSnapshot(snapshot))
  return renderTree(tree)
}

function diffAriaSnapshots(previous, current) {
  const summariesOf = snap => collectSummaries(dropEmpty(parseSnapshot(snap)))
  const { added, removed } = diffSummaries(summariesOf(previous), summariesOf(current))
  return formatDiff(added, removed)
}

export { diffAriaSnapshots, compactAriaSnapshot }
