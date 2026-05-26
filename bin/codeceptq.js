#!/usr/bin/env node
import { Command } from 'commander'
import query from '../lib/command/query.js'

const program = new Command()

program
  .name('codeceptq')
  .description('Query HTML with CodeceptJS locators (CSS, XPath, fuzzy text, semantic).\n\nReads HTML from stdin or --file and prints matching elements with line numbers.')
  .argument('<locator>', 'locator string (CSS, XPath, or text for semantic match)')
  .argument('[context]', 'scope locator — restrict matches to descendants of context')
  .option('--field', 'treat locator as form field (input/textarea/select)')
  .option('--click', 'treat locator as clickable element (link, button, role=button, ...)')
  .option('--clickable', 'alias for --click')
  .option('--checkable', 'treat locator as checkbox/radio')
  .option('--select', 'treat locator as <option> visible text')
  .option('--xpath', 'force XPath interpretation')
  .option('--css', 'force CSS interpretation')
  .option('--file <path>', 'read HTML from file instead of stdin')
  .option('--limit <n>', 'cap matches printed', '20')
  .option('--snippet <chars>', 'truncate outerHTML per match to N characters', '500')
  .option('--full', 'print full outerHTML (no truncation)')
  .option('--json', 'output JSON')
  .addHelpText(
    'after',
    `
Examples:
  cat trace/0001_page.html | codeceptq './/input'
  cat trace/0001_page.html | codeceptq 'Username' --field
  cat trace/0001_page.html | codeceptq 'Username' '.form' --field
  codeceptq './/button' --file trace/0001_page.html
  codeceptq 'Login' --click --file page.html

Exit codes:
  0  matches found
  1  no matches
  2  invalid input or XPath
`,
  )
  .action(async (locator, context, options) => {
    try {
      await query(locator, context, options)
    } catch (err) {
      console.error(`codeceptq: ${err.message}`)
      process.exitCode = 2
    }
  })

program.parseAsync(process.argv)
