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
  'radiogroup',
  'switch',
  'combobox',
  'listbox',
  'listitem',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'tab',
  'tabpanel',
  'tablist',
  'slider',
  'spinbutton',
  'tree',
  'treeitem',
  'grid',
  'gridcell',
  'row',
  'rowheader',
  'columnheader',
  'toolbar',
  'progressbar',
])

const IGNORED_ROLES = new Set(['navigation'])

// ─────────────────────────────────────────────────────────────────
// Tunables (knobs that change pipeline behavior)
// ─────────────────────────────────────────────────────────────────

const SIBLING_COLLAPSE_THRESHOLD = 50
const SIBLING_COLLAPSE_KEEP_EACH_SIDE = 5

// ─────────────────────────────────────────────────────────────────
// STEP 1 · Parse: YAML text → AriaNode[]
// ─────────────────────────────────────────────────────────────────

function normalizeScalar(input) {
  let value = String(input).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  const lower = value.toLowerCase()
  if (lower === 'true') return true
  if (lower === 'false') return false
  if (lower === 'null') return null
  return value
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
      attributes[tok.slice(0, eq).trim().toLowerCase()] = normalizeScalar(tok.slice(eq + 1))
    }
  }

  return { role, name, attributes }
}

function yamlItemToNode(item) {
  if (typeof item === 'string') {
    const label = parseLabel(item)
    if (!label) return null
    const node = { role: label.role, attributes: label.attributes, children: [] }
    if (label.name && label.name.trim() !== '') node.name = label.name.trim()
    return node
  }
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null

  const entries = Object.entries(item)
  if (entries.length === 0) return null
  const [key, value] = entries[0]
  const label = parseLabel(key)
  if (!label) return null
  const node = { role: label.role, attributes: label.attributes, children: [] }
  if (label.name && label.name.trim() !== '') node.name = label.name.trim()

  if (Array.isArray(value)) {
    node.children = value.map(yamlItemToNode).filter(n => n !== null)
    return node
  }
  if (value === null || value === undefined) return node
  const normalized = normalizeScalar(String(value))
  if (normalized !== '' && normalized !== undefined) node.value = normalized
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
// STEP 2 · Transforms: AriaNode[] → AriaNode[]
//   Each is a pure function. Compose by stacking calls in the public API.
// ─────────────────────────────────────────────────────────────────

// Dissolve <navigation> wrappers into their children.
function unwrapIgnored(nodes) {
  return nodes.flatMap(node => {
    const children = unwrapIgnored(node.children)
    if (IGNORED_ROLES.has(node.role)) return children
    return [{ ...node, children }]
  })
}

// Walk children to produce a synthetic label for naming icon-only buttons.
function summarizeChildren(children) {
  return children
    .map(child => {
      let part = child.role
      if (child.name) part += ` "${child.name}"`
      const nested = summarizeChildren(child.children)
      if (nested) part += ` > ${nested}`
      return part
    })
    .join(', ')
}

// Set node.name = "{img "icon"}" for buttons/links that have no name but do have children.
// Recurses so nested buttons get named too. Uses ORIGINAL children for the summary, before pruning.
function nameIconButtons(nodes) {
  return nodes.map(node => {
    const namedChildren = nameIconButtons(node.children)
    if (node.name) return { ...node, children: namedChildren }
    if (node.role !== 'button' && node.role !== 'link') return { ...node, children: namedChildren }
    if (node.children.length === 0) return { ...node, children: namedChildren }
    return { ...node, name: `{${summarizeChildren(node.children)}}`, children: namedChildren }
  })
}

// Drop containers that contribute nothing.
//   keepNamed=true → also keep named non-interactive nodes (e.g. headings, named text).
function dropEmpty(nodes, opts = {}) {
  return nodes.flatMap(node => {
    const children = dropEmpty(node.children, opts)
    if (INTERACTIVE_ROLES.has(node.role)) return [{ ...node, children }]
    if (children.length > 0) return [{ ...node, children }]
    if (opts.keepNamed && (node.name || node.value !== undefined)) return [{ ...node, children }]
    return []
  })
}

// ─────────────────────────────────────────────────────────────────
// STEP 3 · Render: AriaNode[] → text or flat entries
// ─────────────────────────────────────────────────────────────────

// One-line representation of a node. Stable attr order so diff comparisons are deterministic.
function formatNode(node) {
  let line = node.role
  if (node.name?.trim()) line += ` "${node.name.trim()}"`
  const attrStr = Object.keys(node.attributes)
    .sort()
    .map(k => {
      const v = node.attributes[k]
      if (v === undefined || v === null || v === '') return ''
      if (v === true) return k
      return `${k}=${v}`
    })
    .filter(Boolean)
    .join(' ')
  if (attrStr) line += ` [${attrStr}]`
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

// Large group of same-role siblings → first N + "...M omitted..." marker + last N.
function collapseGroup(group, depth) {
  if (group.length <= SIBLING_COLLAPSE_THRESHOLD) {
    return group.map(node => ({ node }))
  }
  const keep = SIBLING_COLLAPSE_KEEP_EACH_SIDE
  const omitted = group.length - keep * 2
  const indent = '  '.repeat(depth)
  return [
    ...group.slice(0, keep).map(node => ({ node })),
    { placeholder: `${indent}- ...${omitted} similar "${group[0].role}" items omitted...` },
    ...group.slice(-keep).map(node => ({ node })),
  ]
}

function collapseSiblingGroups(nodes, depth) {
  return groupByConsecutiveRole(nodes).flatMap(group => collapseGroup(group, depth))
}

// Tree → indented YAML text.
function renderTree(nodes, depth = 0) {
  return collapseSiblingGroups(nodes, depth)
    .map(entry => {
      if ('placeholder' in entry) return entry.placeholder
      const { node } = entry
      const indent = '  '.repeat(depth)
      const head = `${indent}- ${formatNode(node)}`
      if (node.children.length === 0) return head
      return `${head}:\n${renderTree(node.children, depth + 1)}`
    })
    .join('\n')
}

// Build the structured "entry" object for an interactive node, or null if not worth keeping.
function nodeToEntry(node) {
  if (!INTERACTIVE_ROLES.has(node.role)) return null
  const entry = { role: node.role }
  if (node.name?.trim()) entry.name = node.name.trim()
  if (node.value !== undefined && node.value !== null) {
    const text = String(node.value).trim()
    if (text) entry.value = node.value
  }
  for (const [key, value] of Object.entries(node.attributes)) {
    if (value === undefined || value === null || value === '') continue
    entry[key] = value
  }
  const isButtonOrLink = node.role === 'button' || node.role === 'link'
  const hasContent = Object.keys(entry).length > 1
  if (isButtonOrLink && !hasContent) {
    entry.unnamed = true
    return entry
  }
  if (!hasContent) return null
  return entry
}

// Walk tree, emit one FlatEntry per interactive node. Path is dotted index from root.
function flatten(nodes) {
  const collect = (node, path) => {
    const entry = nodeToEntry(node)
    const here = entry ? [{ path, summary: formatNode(node), entry }] : []
    const fromChildren = node.children.flatMap((child, i) => collect(child, `${path}.${i}`))
    return [...here, ...fromChildren]
  }
  return nodes.flatMap((node, i) => collect(node, String(i)))
}

// ─────────────────────────────────────────────────────────────────
// STEP 4 · Diff: FlatEntry[] × FlatEntry[] → text
// ─────────────────────────────────────────────────────────────────

function countBy(items) {
  return items.reduce((map, item) => {
    if (item === '') return map
    map.set(item, (map.get(item) ?? 0) + 1)
    return map
  }, new Map())
}

// Bag-style diff: any summary appearing more in one bag than the other becomes added/removed.
function diffByCount(before, after) {
  const added = []
  const removed = []
  const all = new Set([...before.keys(), ...after.keys()])
  for (const summary of all) {
    const b = before.get(summary) ?? 0
    const a = after.get(summary) ?? 0
    for (let i = 0; i < a - b; i += 1) added.push(summary)
    for (let i = 0; i < b - a; i += 1) removed.push(summary)
  }
  return { added, removed }
}

// When the same path has a different summary AND the per-summary totals haven't shifted,
// treat it as a rename (one add + one remove). Catches "button text changed" cases that
// the count-based diff would miss.
function detectRenames(prev, curr, prevTotals, currTotals) {
  const added = []
  const removed = []
  const prevByPath = new Map(prev.map(e => [e.path, e.summary]))
  const currByPath = new Map(curr.map(e => [e.path, e.summary]))

  for (const [path, beforeSummary] of prevByPath) {
    const afterSummary = currByPath.get(path)
    if (!afterSummary || afterSummary === beforeSummary) continue
    const totalsAfter = (currTotals.get(afterSummary) ?? 0) === (prevTotals.get(afterSummary) ?? 0)
    const totalsBefore = (currTotals.get(beforeSummary) ?? 0) === (prevTotals.get(beforeSummary) ?? 0)
    if (!totalsAfter || !totalsBefore) continue
    const beforeElsewhere = curr.some(e => e.path !== path && e.summary === beforeSummary)
    const afterElsewhere = prev.some(e => e.path !== path && e.summary === afterSummary)
    if (beforeElsewhere && afterElsewhere) continue
    added.push(afterSummary)
    removed.push(beforeSummary)
  }
  return { added, removed }
}

function formatDiff(added, removed) {
  if (added.length === 0 && removed.length === 0) return null
  const lines = ['ariaDiff:']
  const addedSummary = countBy(added)
  if (addedSummary.size === 0) {
    lines.push('  added: []')
  } else {
    lines.push('  added:')
    Array.from(addedSummary.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([item, count]) => {
        const suffix = count > 1 ? ` (x${count})` : ''
        lines.push(`    - ${item}${suffix}`)
      })
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

function compactAriaSnapshot(snapshot, keepNamed = false) {
  if (!snapshot) return ''
  let tree = parseSnapshot(snapshot)
  tree = unwrapIgnored(tree)
  tree = nameIconButtons(tree)
  tree = dropEmpty(tree, { keepNamed })
  return renderTree(tree)
}

function diffAriaSnapshots(previous, current) {
  const flat = snap => {
    let tree = parseSnapshot(snap)
    tree = unwrapIgnored(tree)
    tree = nameIconButtons(tree)
    tree = dropEmpty(tree)
    return flatten(tree)
  }
  const prev = flat(previous)
  const curr = flat(current)
  const prevTotals = countBy(prev.map(e => e.summary))
  const currTotals = countBy(curr.map(e => e.summary))
  const byCount = diffByCount(prevTotals, currTotals)
  const renames = detectRenames(prev, curr, prevTotals, currTotals)
  return formatDiff([...byCount.added, ...renames.added], [...byCount.removed, ...renames.removed])
}

export { diffAriaSnapshots, compactAriaSnapshot }
