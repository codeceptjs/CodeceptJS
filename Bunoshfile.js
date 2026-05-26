import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import axios from 'axios'
import semver from 'semver'

const { shell, writeToFile, copyFile, task } = global.bunosh
const { say, yell } = global.bunosh

const documentjsCliArgs = '-f md --shallow --markdown-toc=false --sort-order=alpha'

const helperMarkDownFile = name => `docs/helpers/${name}.md`
const pluginMarkDownFile = name => `docs/plugins/${name}.md`

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

  const files = fs.readdirSync('lib/plugin').filter(f => path.extname(f) === '.js')

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
permalink: /plugins/${name}
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
      line`## [${name}](/plugins/${name})`
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
    line`---\npermalink: /helpers/${helper}\nsidebar: auto\ntitle: ${helper}\n---\n\n# ${helper}\n\n`
    line.fromFile(helperMarkDownFile(helper))
  })

  replaceInFile(`node_modules/@codeceptjs/detox-helper/${helper}.js`, cfg => {
    cfg.replace(/string \| object/g, 'CodeceptJS.LocatorOrString')
    cfg.replace(/string \| object/g, 'LocatorOrString')
  })

  await writeToFile(helperMarkDownFile(helper), line => {
    line`---\npermalink: /helpers/${helper}\nsidebar: auto\ntitle: ${helper}\n---\n\n# ${helper}\n\n`
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
  const resp = await axios.get('https://raw.githubusercontent.com/codecept-js/vue-cli-plugin-codeceptjs-puppeteer/master/README.md')

  await writeToFile('docs/vue.md', line => {
    line`---\npermalink: /vue\nlayout: Section\nsidebar: false\ntitle: Testing Vue Apps\n---\n\n`
    line`${resp.data}`
  })
}

/**
 * Copy helpers into docs/build and inline webapi partials (optionally preserving CodeceptJS types for typings).
 * @param {boolean} [forTypings=false] - Keep CodeceptJS.* type names instead of expanding them.
 */
export async function buildLibWithDocs(forTypings = false) {
  task.stopOnFailures()
  const files = fs.readdirSync('lib/helper').filter(f => path.extname(f) === '.js')
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
  const files = fs.readdirSync('lib/helper').filter(f => path.extname(f) === '.js')
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

  for (const file of files) {
    const name = path.basename(file, '.js')
    if (ignoreList.indexOf(name) >= 0) continue
    say(`Writing documentation for ${name}`)
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

    await shell`npx documentation build docs/build/${file} -o docs/helpers/${name}.md ${documentjsCliArgs}`
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

    if (name === 'Appium') {
      await docsAppium()
    }

    await writeToFile(helperMarkDownFile(name), line => {
      line`---
permalink: /helpers/${name}
editLink: false
sidebar: auto
title: ${name}
---

`
      line.fromFile(helperMarkDownFile(name))
    })
  }
}

/**
 * Sync wiki pages from the CodeceptJS.wiki repo into website docs.
 */
export async function wiki() {
  task.stopOnFailures()
  if (!fs.existsSync('docs/wiki/Home.md')) {
    await shell`git clone git@github.com:codeceptjs/CodeceptJS.wiki.git docs/wiki`
  }
  await shell`git pull origin master`.cwd('docs/wiki')

  await writeToFile('docs/community-helpers.md', line => {
    line`---`
    line`permalink: /community-helpers`
    line`title: Community Helpers`
    line`editLink: false`
    line`---`
    line``
    line`# Community Helpers`
    line`> Share your helpers at our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Community-Helpers)`
    line``
    line.fromFile('docs/wiki/Community-Helpers-&-Plugins.md')
  })

  await writeToFile('docs/examples.md', line => {
    line`---`
    line`permalink: /examples`
    line`layout: Section`
    line`sidebar: false`
    line`title: Examples`
    line`editLink: false`
    line`---`
    line``
    line`# Examples`
    line`> Add your own examples to our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Examples)`
    line.fromFile('docs/wiki/Examples.md')
  })

  await writeToFile('docs/books.md', line => {
    line`---`
    line`permalink: /books`
    line`layout: Section`
    line`sidebar: false`
    line`title: Books & Posts`
    line`editLink: false`
    line`---`
    line``
    line`# Books & Posts`
    line`> Add your own books or posts to our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Books-&-Posts)`
    line.fromFile('docs/wiki/Books-&-Posts.md')
  })

  await writeToFile('docs/videos.md', line => {
    line`---`
    line`permalink: /videos`
    line`layout: Section`
    line`sidebar: false`
    line`title: Videos`
    line`editLink: false`
    line`---`
    line``
    line`> Add your own videos to our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Videos)`
    line.fromFile('docs/wiki/Videos.md')
  })
}

/**
 * Generate docs for Appium by merging in public WebDriver methods.
 */
export async function docsAppium() {
  const documentation = await import('documentation')
  const onlyWeb = [/Title/, /Popup/, /Cookie/, /Url/, /^press/, /^refreshPage/, /^resizeWindow/, /Script$/, /cursor/, /Css/, /Tab$/, /^wait/]
  const webdriverDoc = await documentation.build(['docs/build/WebDriver.js'], {
    shallow: true,
    order: 'asc',
  })
  const doc = await documentation.build(['docs/build/Appium.js'], {
    shallow: true,
    order: 'asc',
  })

  for (const method of webdriverDoc[0].members.instance) {
    if (onlyWeb.filter(f => method.name.match(f)).length) continue
    if (doc[0].members.instance.filter(m => m.name === method.name).length) continue
    doc[0].members.instance.push(method)
  }
  const output = await documentation.formats.md(doc)
  fs.writeFileSync('docs/helpers/Appium.md', output)
}

/**
 * Update the codecept.io website: regenerate changelog, sync wiki, push docs and publish.
 */
export async function publishSite() {
  await processChangelog()
  await wiki()

  const dir = 'website'
  if (fs.existsSync(dir)) {
    await shell`rm -rf ${dir}`
  }

  await shell`git clone git@github.com:codeceptjs/website.git ${dir}`
  copyFile('docs', 'website/docs')

  await shell`git add -A`.cwd(dir)
  await shell`git commit -m "synchronized with docs"`.cwd(dir)
  await shell`git pull`.cwd(dir)
  await shell`git push`.cwd(dir)
  await shell`./runok.js publish`.cwd(dir)
}

/**
 * Run the PHP test app and the REST test server together. Warning! PHP required!
 */
export async function server() {
  await Promise.all([shell`php -S 127.0.0.1:8000 -t test/data/app`, testServer()])
}

/**
 * Release CodeceptJS to npm. Optionally bump package.json version first.
 * @param {string} [releaseType] - "patch", "minor" or "major" to bump before releasing.
 */
export async function release(releaseType = null) {
  task.stopOnFailures()
  const packageInfo = JSON.parse(fs.readFileSync('package.json'))
  if (releaseType) {
    packageInfo.version = semver.inc(packageInfo.version, releaseType)
    fs.writeFileSync('package.json', JSON.stringify(packageInfo))
    await shell`git add package.json`
    await shell`git commit -m "version bump"`
  }
  const version = packageInfo.version
  await docs()
  await def()
  await publishSite()
  await shell`git pull`
  await shell`git tag ${version}`
  await shell`git push origin 3.x --tags`
  await shell`rm -rf docs/wiki/.git`
  await shell`npm publish`
  say('-- RELEASED --')
}


/**
 * Update the contributors table in README.md from the GitHub API.
 */
export async function contributorFaces() {
  const owner = 'codeceptjs'
  const repo = 'codeceptjs'
  const token = process.env.GH_TOKEN

  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contributors`, {
      headers: { Authorization: `token ${token}` },
    })

    const excludeUsers = ['dependabot[bot]', 'actions-user']
    const filteredContributors = response.data.filter(contributor => !excludeUsers.includes(contributor.login))

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

async function processChangelog() {
  const file = 'CHANGELOG.md'
  let changelog = fs.readFileSync(file).toString()

  changelog = changelog.replace(/\s@([\w-]+)/gm, ' **[$1](https://github.com/$1)**')
  changelog = changelog.replace(/#(\d+)/gm, '[#$1](https://github.com/codeceptjs/CodeceptJS/issues/$1)')
  changelog = changelog.replace(/\s\[(\w+)\]\s/gm, ' **[$1]** ')

  await writeToFile('docs/changelog.md', line => {
    line`---`
    line`permalink: /changelog`
    line`title: Releases`
    line`sidebar: false`
    line`layout: Section`
    line`---`
    line``
    line`# Releases`
    line``
    line`${changelog}`
  })
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
  await shell`eslint bin/ examples/ lib/ test/ translations/ runok.cjs`
}

/**
 * Lint and auto-fix the codebase with ESLint.
 */
export async function lintFix() {
  await shell`eslint bin/ examples/ lib/ test/ translations/ runok.cjs --fix`
}

/**
 * Format the codebase with Prettier.
 */
export async function prettier() {
  await shell`prettier --config prettier.config.js --write bin/**/*.js lib/**/*.js test/**/*.js translations/**/*.js runok.cjs`
}

/**
 * Run unit tests.
 */
export async function testUnit() {
  await shell`mocha test/unit --recursive --timeout 10000 --reporter @testomatio/reporter/mocha`
}

/**
 * Run REST tests.
 */
export async function testRest() {
  await shell`mocha test/rest --recursive --timeout 20000 --reporter @testomatio/reporter/mocha`
}

/**
 * Run runner tests.
 */
export async function testRunner() {
  await shell`mocha test/runner --recursive --timeout 10000 --reporter @testomatio/reporter/mocha`
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
  await shell`mocha test/helper/Appium_test.js --grep 'quick' --reporter @testomatio/reporter/mocha`
}

/**
 * Run the remaining (second) Appium tests.
 */
export async function testAppiumOther() {
  await shell`mocha test/helper/Appium_test.js --grep 'second' --reporter @testomatio/reporter/mocha`
}

/**
 * Run quick iOS Appium tests.
 */
export async function testIosAppiumQuick() {
  await shell`mocha test/helper/Appium_ios_test.js --grep 'quick' --reporter @testomatio/reporter/mocha`
}

/**
 * Run the remaining (second) iOS Appium tests.
 */
export async function testIosAppiumOther() {
  await shell`mocha test/helper/Appium_ios_test.js --grep 'second' --reporter @testomatio/reporter/mocha`
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
  await shell`mocha test/helper/Playwright_test.js --reporter @testomatio/reporter/mocha`
}

/**
 * Run Puppeteer helper unit tests.
 */
export async function testWebapiPuppeteer() {
  await shell`mocha test/helper/Puppeteer_test.js --reporter @testomatio/reporter/mocha`
}

/**
 * Run WebDriver helper unit tests.
 */
export async function testWebapiWebdriver() {
  await shell`mocha test/helper/WebDriver_test.js --timeout 10000 --reporter @testomatio/reporter/mocha`
}

/**
 * Run WebDriver helper unit tests without a Selenium server.
 */
export async function testWebapiWebdriverNoSelenium() {
  await shell`mocha test/helper/WebDriver.noSeleniumServer_test.js --timeout 10000 --reporter @testomatio/reporter/mocha`
}

/**
 * Run Expect helper unit tests.
 */
export async function testExpect() {
  await shell`mocha test/helper/Expect_test.js --reporter @testomatio/reporter/mocha`
}

/**
 * Run plugin tests.
 */
export async function testPlugin() {
  await shell`mocha test/plugin/plugin_test.js --reporter @testomatio/reporter/mocha`
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
