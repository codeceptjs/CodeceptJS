import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import semver from 'semver'

const { shell, writeToFile, copyFile, task } = global.bunosh
const { say, yell } = global.bunosh

const documentjsCliArgs = '-f md --shallow --markdown-toc=false --sort-order=alpha'

const helperSlug = name => name.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const helperMarkDownFile = name => `docs/helpers/${name}.md`
const pluginMarkDownFile = name => `docs/plugins/${name}.md`
const pluginSlug = name => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * Generate all documentation (helpers, plugins and external helpers in parallel).
 */
export async function docs() {
  task.stopOnFailures()
  await Promise.all([docsHelpers(), docsPlugins(), docsExternalHelpers()])
}

/**
 * Build lib with docs, regenerate plugin/external docs and TypeScript definitions.
 */
export async function def() {
  task.stopOnFailures()
  await Promise.all([buildLibWithDocs(true), docsPlugins(), docsExternalHelpers()])
  await defTypings()
}

/**
 * Generate TypeScript definition files from JSDoc.
 */
export async function defTypings() {
  task.stopOnFailures()
  say('Generate TypeScript definition')
  await shell`npx jsdoc -c typings/jsdocPromiseBased.conf.json`
  fs.renameSync('typings/types.d.ts', 'typings/promiseBasedTypes.d.ts')
  await shell`npx jsdoc -c typings/jsdoc.conf.json`
}

/**
 * Generate documentation for plugins: each plugin gets a dedicated page plus an overview index.
 */
export async function docsPlugins() {
  task.stopOnFailures()
  ensureDir('docs/plugins')

  const files = fs.readdirSync('lib/plugin').filter(f => path.extname(f) === '.js').sort()

  const sharedPartials = fs.readdirSync('docs/shared').filter(f => path.extname(f) === '.mustache')
  const sharedPlaceholders = sharedPartials.map(file => `{{ ${path.basename(file, '.mustache')} }}`)
  const sharedTemplates = sharedPartials.map(file => fs.readFileSync(`docs/shared/${file}`).toString()).map(template => `\n\n\n${template}`)

  const index = []

  for (const file of files) {
    const name = path.basename(file, '.js')
    say(`Writing documentation for ${name} plugin`)

    await shell`npx documentation build lib/plugin/${file} -o ${pluginMarkDownFile(name)} ${documentjsCliArgs}`

    replaceInFile(pluginMarkDownFile(name), cfg => {
      cfg.replace(/\(optional, default.*?\)/gm, '')
      cfg.replace(/\\*/gm, '')
    })

    replaceInFile(pluginMarkDownFile(name), cfg => {
      for (const i in sharedPlaceholders) {
        cfg.replace(sharedPlaceholders[i], sharedTemplates[i])
      }
    })

    const lines = fs.readFileSync(pluginMarkDownFile(name)).toString().split('\n')
    const headingAt = lines.findIndex(l => l.startsWith('## '))
    const summary = []
    for (let i = headingAt + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!summary.length && !line) continue
      if (summary.length && (!line || line.startsWith('#') || line.startsWith('```'))) break
      summary.push(line)
    }
    index.push({ name, summary: summary.join(' ').trim() })

    await writeToFile(pluginMarkDownFile(name), line => {
      line`---
permalink: /plugins/${pluginSlug(name)}
editLink: false
sidebar: auto
title: ${name}
---
`
      line.fromFile(pluginMarkDownFile(name))
    })
  }

  await writeToFile('docs/plugins.md', line => {
    line`---`
    line`permalink: /plugins`
    line`editLink: false`
    line`sidebar: auto`
    line`title: Plugins`
    line`---`
    line``
    line`# Plugins`
    line``
    line`CodeceptJS bundles the following plugins. Each plugin has its own page with full configuration reference.`
    line``
    for (const { name, summary } of index) {
      line`## [${name}](/plugins/${pluginSlug(name)})`
      line``
      if (summary) line`${summary}`
      line``
    }
  })
}

/**
 * Generate documentation for helpers that live outside of the main repo (Detox, MockRequest).
 */
export async function docsExternalHelpers() {
  task.stopOnFailures()
  say('Building @codecepjs/detox helper docs')
  let helper = 'Detox'
  replaceInFile(`node_modules/@codeceptjs/detox-helper/${helper}.js`, cfg => {
    cfg.replace(/CodeceptJS.LocatorOrString/g, 'string | object')
    cfg.replace(/LocatorOrString/g, 'string | object')
  })
  await shell`npx documentation build node_modules/@codeceptjs/detox-helper/${helper}.js -o ${helperMarkDownFile(helper)} ${documentjsCliArgs}`

  await writeToFile(helperMarkDownFile(helper), line => {
    line`---\npermalink: /helpers/${helperSlug(helper)}\nsidebar: auto\ntitle: ${helper}\n---\n\n# ${helper}\n\n`
    line.fromFile(helperMarkDownFile(helper))
  })

  replaceInFile(`node_modules/@codeceptjs/detox-helper/${helper}.js`, cfg => {
    cfg.replace(/string \| object/g, 'CodeceptJS.LocatorOrString')
    cfg.replace(/string \| object/g, 'LocatorOrString')
  })

  say('Building @codeceptjs/mock-request')
  helper = 'MockRequest'
  replaceInFile('node_modules/@codeceptjs/mock-request/index.js', cfg => {
    cfg.replace(/CodeceptJS.LocatorOrString/g, 'string | object')
    cfg.replace(/LocatorOrString/g, 'string | object')
  })
  await shell`npx documentation build node_modules/@codeceptjs/mock-request/index.js -o ${helperMarkDownFile(helper)} ${documentjsCliArgs}`

  await writeToFile(helperMarkDownFile(helper), line => {
    line`---\npermalink: /helpers/${helperSlug(helper)}\nsidebar: auto\ntitle: ${helper}\n---\n\n# ${helper}\n\n`
    line.fromFile(helperMarkDownFile(helper))
  })

  replaceInFile('node_modules/@codeceptjs/mock-request/index.js', cfg => {
    cfg.replace(/string \| object/g, 'CodeceptJS.LocatorOrString')
    cfg.replace(/string \| object/g, 'LocatorOrString')
  })
}

/**
 * Generate documentation for the externally hosted Vue plugin.
 */
export async function docsExternalPlugins() {
  say('Building Vue plugin docs')
  const resp = await fetch('https://raw.githubusercontent.com/codecept-js/vue-cli-plugin-codeceptjs-puppeteer/master/README.md')
  const body = await resp.text()

  await writeToFile('docs/vue.md', line => {
    line`---
permalink: /vue
layout: Section
sidebar: false
title: Testing Vue Apps
---

`
    line`${body}`
  })
}

/**
 * Copy helpers into docs/build and inline webapi partials (optionally preserving CodeceptJS types for typings).
 * @param {boolean} [forTypings=false] - Keep CodeceptJS.* type names instead of expanding them.
 */
export async function buildLibWithDocs(forTypings = false) {
  task.stopOnFailures()
  const files = fs.readdirSync('lib/helper').filter(f => path.extname(f) === '.js').sort()
  ensureDir('docs/build')

  const partials = fs.readdirSync('docs/webapi').filter(f => path.extname(f) === '.mustache')
  const placeholders = partials.map(file => `{{> ${path.basename(file, '.mustache')} }}`)
  const templates = partials
    .map(file => fs.readFileSync(`docs/webapi/${file}`).toString())
    .map(template =>
      template
        .replace(/^/gm, '   * ')
        .replace(/^/, '\n')
        .replace(/\s*\* /, ''),
    )

  for (const file of files) {
    const name = path.basename(file, '.js')
    say(`Building helpers with docs for ${name}`)
    copyFile(`lib/helper/${file}`, `docs/build/${file}`)
    replaceInFile(`docs/build/${file}`, cfg => {
      for (const i in placeholders) {
        cfg.replace(placeholders[i], templates[i])
      }
      if (!forTypings) {
        cfg.replace(/CodeceptJS.LocatorOrString\?/g, '(string | object)?')
        cfg.replace(/LocatorOrString\?/g, '(string | object)?')
        cfg.replace(/CodeceptJS.LocatorOrString/g, 'string | object')
        cfg.replace(/LocatorOrString/g, 'string | object')
        cfg.replace(/CodeceptJS.StringOrSecret/g, 'string | object')
      }
      cfg.replace(/^import\s+([^'"`\s{]+)\s+from\s+['"`]([^'"`]+)['"`]/gm, "const $1 = require('$2')")
      cfg.replace(/^import\s*\{\s*([^}]+)\s*\}\s*from\s+['"`]([^'"`]+)['"`]/gm, (match, imports, importPath) => {
        if (imports.includes(' as ')) {
          const parts = imports.split(',').map(i => i.trim())
          const assignments = parts.map(part => {
            if (part.includes(' as ')) {
              const [original, alias] = part.split(' as ').map(s => s.trim())
              return `const ${alias} = require('${importPath}').${original}`
            }
            return `const ${part} = require('${importPath}').${part}`
          })
          return assignments.join(';\n')
        }
        return `const { ${imports} } = require('${importPath}')`
      })
      cfg.replace(/^import\s+\*\s+as\s+([^'"`]+)\s+from\s+['"`]([^'"`]+)['"`]/gm, "const $1 = require('$2')")

      cfg.replace(/^export\s*\{\s*([^}]+)\s+as\s+default\s*\}/gm, 'module.exports = $1')
      cfg.replace(/^export\s+default\s+(.+)/gm, 'module.exports = $1')
      cfg.replace(/^export\s*\{\s*([^}]+)\s*\}/gm, 'module.exports = { $1 }')
      cfg.replace(/^export\s+(class|function|const|let|var)\s+([^\s=]+)/gm, '$1 $2')
    })
  }
}

/**
 * Generate documentation pages for all bundled helpers.
 */
export async function docsHelpers() {
  task.stopOnFailures()
  const files = fs.readdirSync('lib/helper').filter(f => path.extname(f) === '.js').sort()
  ensureDir('docs/build')

  const ignoreList = ['Polly', 'MockRequest']

  const partials = fs.readdirSync('docs/webapi').filter(f => path.extname(f) === '.mustache')
  const placeholders = partials.map(file => `{{> ${path.basename(file, '.mustache')} }}`)
  const templates = partials
    .map(file => fs.readFileSync(`docs/webapi/${file}`).toString())
    .map(template =>
      template
        .replace(/^/gm, '   * ')
        .replace(/^/, '\n')
        .replace(/\s*\* /, ''),
    )

  const sharedPartials = fs.readdirSync('docs/shared').filter(f => path.extname(f) === '.mustache')
  const sharedPlaceholders = sharedPartials.map(file => `{{ ${path.basename(file, '.mustache')} }}`)
  const sharedTemplates = sharedPartials.map(file => fs.readFileSync(`docs/shared/${file}`).toString()).map(template => `\n\n\n${template}`)

  const helperFiles = files.filter(file => ignoreList.indexOf(path.basename(file, '.js')) < 0)

  for (const file of helperFiles) {
    copyFile(`lib/helper/${file}`, `docs/build/${file}`)
    replaceInFile(`docs/build/${file}`, cfg => {
      for (const i in placeholders) {
        cfg.replace(placeholders[i], templates[i])
      }
      cfg.replace(/CodeceptJS.LocatorOrString\?/g, '(string | object)?')
      cfg.replace(/LocatorOrString\?/g, '(string | object)?')
      cfg.replace(/CodeceptJS.LocatorOrString/g, 'string | object')
      cfg.replace(/LocatorOrString/g, 'string | object')
      cfg.replace(/CodeceptJS.StringOrSecret/g, 'string | object')

      cfg.replace(/^import\s+([^'"`\s{]+)\s+from\s+['"`]([^'"`]+)['"`]/gm, "const $1 = require('$2')")
      cfg.replace(/^import\s*\{\s*([^}]+)\s*\}\s*from\s+['"`]([^'"`]+)['"`]/gm, (match, imports, importPath) => {
        if (imports.includes(' as ')) {
          const parts = imports.split(',').map(i => i.trim())
          const assignments = parts.map(part => {
            if (part.includes(' as ')) {
              const [original, alias] = part.split(' as ').map(s => s.trim())
              return `const ${alias} = require('${importPath}').${original}`
            }
            return `const ${part} = require('${importPath}').${part}`
          })
          return assignments.join(';\n')
        }
        return `const { ${imports} } = require('${importPath}')`
      })
      cfg.replace(/^import\s+\*\s+as\s+([^'"`]+)\s+from\s+['"`]([^'"`]+)['"`]/gm, "const $1 = require('$2')")

      cfg.replace(/^export\s*\{\s*([^}]+)\s+as\s+default\s*\}/gm, 'module.exports = $1')
      cfg.replace(/^export\s+default\s+(.+)/gm, 'module.exports = $1')
      cfg.replace(/^export\s*\{\s*([^}]+)\s*\}/gm, 'module.exports = { $1 }')
      cfg.replace(/^export\s+(class|function|const|let|var)\s+([^\s=]+)/gm, '$1 $2')
    })
  }

  for (const file of helperFiles) {
    const name = path.basename(file, '.js')
    if (abstractHelpers.includes(name)) continue
    say(`Writing documentation for ${name}`)

    await docsHelperMarkdown(name, inheritedHelperDocs[name])
    replaceInFile(helperMarkDownFile(name), cfg => {
      cfg.replace(/\(optional, default.*?\)/gm, '')
      cfg.replace(/\\*/gm, '')
    })

    replaceInFile(helperMarkDownFile(name), cfg => {
      for (const i in sharedPlaceholders) {
        cfg.replace(sharedPlaceholders[i], sharedTemplates[i])
      }
    })

    replaceInFile(helperMarkDownFile(name), cfg => {
      const regex = /## config((.|\n)*)\[1\]/m
      const fullText = fs.readFileSync(helperMarkDownFile(name)).toString()
      const text = fullText.match(regex)
      if (!text) return

      cfg.replace('<!-- configuration -->', text[1])
      cfg.replace(regex, '[1]')
    })

    await writeToFile(helperMarkDownFile(name), line => {
      line`---
permalink: /helpers/${helperSlug(name)}
editLink: false
sidebar: auto
title: ${name}
---

`
      line.fromFile(helperMarkDownFile(name))
    })
  }
}

const inheritedHelperDocs = {
  Appium: {
    parent: 'WebDriver',
    exclude: [/Title/, /Popup/, /Cookie/, /Url/, /^press/, /^refreshPage/, /^resizeWindow/, /Script$/, /cursor/, /Css/, /Tab$/, /^wait/],
  },
  Obscura: { parent: 'CDPBrowser' },
  Lightpanda: { parent: 'CDPBrowser' },
  Moli: { parent: 'CDPBrowser' },
  Kitesurf: { parent: 'CDPBrowser', excludeConfig: ['endpoint', 'headers'] },
}

const abstractHelpers = ['CDPBrowser']

const helperHooks = [
  '_init',
  '_before',
  '_after',
  '_beforeStep',
  '_afterStep',
  '_beforeSuite',
  '_afterSuite',
  '_passed',
  '_failed',
  '_finishTest',
  '_setConfig',
  '_validateConfig',
  '_test',
  '_useTo',
]

async function docsHelperMarkdown(name, { parent, exclude = [], excludeConfig = [] } = {}) {
  const documentation = await import('documentation')
  const buildOptions = { shallow: true, sortOrder: ['alpha'] }
  const doc = await documentation.build([`docs/build/${name}.js`], buildOptions)
  doc.sort((a, b) => (b.kind === 'class') - (a.kind === 'class'))
  let members = doc[0].members.instance

  if (parent) {
    const parentDoc = await documentation.build([`docs/build/${parent}.js`], buildOptions)
    for (const method of parentDoc.find(c => c.kind === 'class').members.instance) {
      if (exclude.some(f => method.name.match(f))) continue
      if (members.some(m => m.name === method.name)) continue
      members.push(method)
    }

    const config = doc.find(c => c.name === 'config')
    const parentConfig = parentDoc.find(c => c.name === 'config')
    if (config && parentConfig) {
      for (const prop of parentConfig.properties) {
        if (excludeConfig.includes(prop.name)) continue
        if (config.properties.some(p => p.name === prop.name)) continue
        config.properties.push(prop)
      }
    }
  }

  members = members.filter(m => !helperHooks.includes(m.name))
  members.sort((a, b) => a.name.startsWith('_') - b.name.startsWith('_') || a.name.localeCompare(b.name))
  doc[0].members.instance = members

  const output = await documentation.formats.md(doc, { markdownToc: false })
  fs.writeFileSync(helperMarkDownFile(name), output)
}

/**
 * Run the PHP test app and the REST test server together. Warning! PHP required!
 */
export async function server() {
  await Promise.all([shell`php -S 127.0.0.1:8000 -t test/data/app`, testServer()])
}

/**
 * Update the contributors table in README.md from the GitHub API.
 */
export async function contributorFaces() {
  const owner = 'codeceptjs'
  const repo = 'codeceptjs'
  const token = process.env.GH_TOKEN

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`, {
      headers: { Authorization: `token ${token}` },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const data = await response.json()

    const excludeUsers = ['dependabot[bot]', 'actions-user']
    const filteredContributors = data.filter(contributor => !excludeUsers.includes(contributor.login))

    const contributors = filteredContributors.map(contributor => {
      return `
<td align="center">
  <a href="${contributor.html_url}">
    <img src="${contributor.avatar_url}" width="100" height="100" alt="${contributor.login}"/><br />
    <sub><b>${contributor.login}</b></sub>
  </a>
</td>`
    })

    const rows = []
    const chunkSize = 4
    for (let i = 0; i < contributors.length; i += chunkSize) {
      rows.push(`<tr>${contributors.slice(i, i + chunkSize).join('')}</tr>`)
    }

    const contributorsTable = `
<table>
  ${rows.join('\n')}
</table>
    `

    const readmePath = path.join(process.cwd(), 'README.md')
    let content = fs.readFileSync(readmePath, 'utf-8')

    const contributorsSectionRegex = /(## Contributors\s*\n)([\s\S]*?)(\n##|$)/
    const match = content.match(contributorsSectionRegex)

    if (match) {
      const updatedContent = content.replace(contributorsSectionRegex, `${match[1]}\n${contributorsTable}\n${match[3]}`)
      fs.writeFileSync(readmePath, updatedContent, 'utf-8')
    } else {
      content += `\n${contributorsTable}`
      fs.writeFileSync(readmePath, content, 'utf-8')
    }

    say('Contributors section updated successfully!')
  } catch (error) {
    yell(`Error fetching contributors: ${error.message}`)
  }
}

/**
 * Scaffold a config, feature test and runner test for a new feature.
 * @param {string} featureName - Name of the feature to scaffold tests for.
 */
export async function runnerCreateTests(featureName) {
  const fsp = fs.promises

  const configDir = path.join('test/data/sandbox/configs', featureName)
  await fsp.mkdir(configDir, { recursive: true })

  const configContent = `exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: '${featureName} tests'
}
`
  await fsp.writeFile(path.join(configDir, `codecept.conf.js`), configContent)

  const testContent = `Feature('${featureName}');

Scenario('test ${featureName}', ({ I }) => {
  // Add test steps here
});
`
  await fsp.writeFile(path.join(configDir, `${featureName}_test.js`), testContent)

  const runnerTestContent = `const { expect } = require('expect')
const exec = require('child_process').exec
const { codecept_dir, codecept_run } = require('./consts')
const debug = require('debug')('codeceptjs:tests')

const config_run_config = (config, grep, verbose = false) =>
  \`\${codecept_run} \${verbose ? '--verbose' : ''} --config \${codecept_dir}/configs/${featureName}/\${config} \${grep ? \`--grep "\${grep}"\` : ''}\`

describe('CodeceptJS ${featureName}', function () {
  this.timeout(10000)

  it('should run ${featureName} test', done => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('OK')
      expect(err).toBeFalsy()
      done()
    })
  })
})
`
  await fsp.writeFile(path.join('test/runner', `${featureName}_test.js`), runnerTestContent)

  say(`Created test files for feature: ${featureName}`)
  say('Run codecept tests with:')
  say(`./bin/codecept.js run --config ${configDir}/codecept.conf.js`)
  say('')
  say('Run tests with:')
  say(`npx mocha test/runner --grep ${featureName}`)
}

/**
 * Run the read-only REST test server on port 8010.
 */
export async function testServer() {
  await shell`node bin/test-server.js test/data/rest/db.json --host 0.0.0.0 -p 8010 --read-only`
}

/**
 * Run the writable REST test server on port 8010.
 */
export async function testServerWritable() {
  await shell`node bin/test-server.js test/data/rest/db.json --host 0.0.0.0 -p 8010`
}

/**
 * Start the mock server.
 */
export async function mockServerStart() {
  await shell`node test/mock-server/start-mock-server.js`
}

/**
 * Stop the mock server (kills the process listening on port 3001).
 */
export async function mockServerStop() {
  await shell`kill -9 $(lsof -t -i:3001)`
}

/**
 * Run the GraphQL test data server.
 */
export async function graphql() {
  await shell`node test/data/graphql/index.js`
}

/**
 * Lint the codebase with ESLint.
 */
export async function lint() {
  await shell`eslint bin/ examples/ lib/ test/ translations/ Bunoshfile.js`
}

/**
 * Lint and auto-fix the codebase with ESLint.
 */
export async function lintFix() {
  await shell`eslint bin/ examples/ lib/ test/ translations/ Bunoshfile.js --fix`
}

/**
 * Format the codebase with Prettier.
 */
export async function prettier() {
  await shell`prettier --config prettier.config.js --write bin/**/*.js lib/**/*.js test/**/*.js translations/**/*.js Bunoshfile.js`
}

/**
 * Run unit tests.
 */
export async function testUnit() {
  await shell`mocha test/unit --recursive --timeout 10000`
}

/**
 * Run REST tests.
 */
export async function testRest() {
  await shell`mocha test/rest --recursive --timeout 20000`
}

/**
 * Run runner tests.
 */
export async function testRunner() {
  await shell`mocha test/runner --recursive --timeout 10000`
}

/**
 * Run the full test suite: unit, rest and runner tests.
 */
export async function test() {
  task.stopOnFailures()
  await testUnit()
  await testRest()
  await testRunner()
}

/**
 * Start the mock server, then run the full test suite.
 */
export async function testWithMockServer() {
  task.stopOnFailures()
  await mockServerStart()
  await test()
}

/**
 * Run quick Appium tests.
 */
export async function testAppiumQuick() {
  await shell`mocha test/helper/Appium_test.js --grep 'quick'`
}

/**
 * Run the remaining (second) Appium tests.
 */
export async function testAppiumOther() {
  await shell`mocha test/helper/Appium_test.js --grep 'second'`
}

/**
 * Run quick iOS Appium tests.
 */
export async function testIosAppiumQuick() {
  await shell`mocha test/helper/Appium_ios_test.js --grep 'quick'`
}

/**
 * Run the remaining (second) iOS Appium tests.
 */
export async function testIosAppiumOther() {
  await shell`mocha test/helper/Appium_ios_test.js --grep 'second'`
}

/**
 * Start the PHP test app on port 8000. Warning! PHP required!
 */
export async function testAppStart() {
  await shell`php -S 127.0.0.1:8000 -t test/data/app`
}

/**
 * Stop the PHP test app (kills the process listening on port 8000).
 */
export async function testAppStop() {
  await shell`kill -9 $(lsof -t -i:8000)`
}

/**
 * Run Playwright helper unit tests.
 */
export async function testWebapiPlaywright() {
  await shell`mocha test/helper/Playwright_test.js`
}

/**
 * Run Puppeteer helper unit tests.
 */
export async function testWebapiPuppeteer() {
  await shell`mocha test/helper/Puppeteer_test.js`
}

/**
 * Run WebDriver helper unit tests.
 */
export async function testWebapiWebdriver() {
  await shell`mocha test/helper/WebDriver_test.js --timeout 10000`
}

/**
 * Run WebDriver helper unit tests without a Selenium server.
 */
export async function testWebapiWebdriverNoSelenium() {
  await shell`mocha test/helper/WebDriver.noSeleniumServer_test.js --timeout 10000`
}

/**
 * Run Expect helper unit tests.
 */
export async function testExpect() {
  await shell`mocha test/helper/Expect_test.js`
}

/**
 * Run plugin tests.
 */
export async function testPlugin() {
  await shell`mocha test/plugin/plugin_test.js`
}

/**
 * Regenerate TypeScript definition files via typings/fixDefFiles.js.
 */
export async function typesFix() {
  await shell`node typings/fixDefFiles.js`
}

/**
 * Fix typings and run tsd type tests.
 */
export async function dtslint() {
  task.stopOnFailures()
  await typesFix()
  await shell`tsd`
}

/**
 * Install husky git hooks.
 */
export async function prepare() {
  await shell`husky install`
}

function replaceInFile(file, fn) {
  let text = fs.readFileSync(file).toString()
  fn({
    replace(pattern, replacement) {
      text = text.replace(pattern, replacement)
    },
  })
  fs.writeFileSync(file, text)
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}
