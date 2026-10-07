import fs from 'fs'
import path from 'path'
import output from '../output.js'
import Config from '../config.js'
import Linter from '../lint.js'
import { getTestRoot } from './utils.js'

export default async function (paths = [], options = {}) {
  let config = {}
  try {
    config = await Config.load(options.config)
  } catch (err) {
    if (options.hook) return
    if (!paths.length || options.config) {
      output.error(err.message)
      process.exitCode = 2
      return
    }
  }
  const linter = new Linter(config, getTestRoot(options.config))

  if (options.hook) return hook(linter)

  const findings = []
  let failed = false
  const files = linter.files(paths)
  for (const file of files) {
    try {
      findings.push(...linter.lintFile(file))
    } catch (err) {
      failed = true
      output.print(`${path.relative(process.cwd(), file)}  ${output.colors.red('parse')}  ${err.message}`)
    }
  }

  const errors = findings.filter(f => f.level === 'error').length
  if (options.json) {
    output.print(JSON.stringify(findings, null, 2))
  } else {
    for (const finding of findings) output.print(format(finding))
    output.print(`${files.length} file(s) checked, ${errors} error(s), ${findings.length - errors} warning(s)`)
  }

  if (errors) process.exitCode = 1
  if (failed) process.exitCode = 2
}

async function hook(linter) {
  let data = ''
  for await (const chunk of process.stdin) data += chunk

  try {
    const { tool_name: tool, tool_input: input } = JSON.parse(data)
    const file = path.resolve(input.file_path)
    if (!linter.includes(file)) return

    let before = ''
    if (fs.existsSync(file)) before = fs.readFileSync(file, 'utf8')

    let after = input.content
    if (tool !== 'Write') {
      after = before
      for (const edit of input.edits || [input]) {
        if (edit.replace_all) after = after.replaceAll(edit.old_string, () => edit.new_string)
        else after = after.replace(edit.old_string, () => edit.new_string)
      }
    }

    const existing = linter
      .lint(before, file)
      .filter(f => f.level === 'error')
      .map(f => `${f.rule}:${f.source}`)
    const added = []
    for (const finding of linter.lint(after, file)) {
      if (finding.level !== 'error') continue
      const index = existing.indexOf(`${finding.rule}:${finding.source}`)
      if (index >= 0) existing.splice(index, 1)
      else added.push(finding)
    }
    if (!added.length) return

    process.stderr.write(`codeceptjs lint blocked this edit:\n${added.map(format).join('\n')}\nFix the code and retry.\n`)
    process.exitCode = 2
  } catch (err) {
    process.exitCode = 0
  }
}

function format(finding) {
  return `${path.relative(process.cwd(), finding.file)}:${finding.line}:${finding.column}  ${finding.level}  ${finding.rule}  ${finding.message}`
}
