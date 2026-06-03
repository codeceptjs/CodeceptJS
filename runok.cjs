#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const {
  stopOnFail,
  chdir,
  tasks: { git, copy, exec, replaceInFile, npmRun, npx, writeToFile },
  runok,
} = require('runok')
const { execSync } = require('node:child_process')
const semver = require('semver')

let documentation

import('documentation').then(mod => (documentation = mod))

const helperMarkDownFile = function (name) {
  return `docs/helpers/${name}.md`
}
const pluginMarkDownFile = function (name) {
  return `docs/plugins/${name}.md`
}
const documentjsCliArgs = '-f md --shallow --markdown-toc=false --sort-order=alpha'

stopOnFail()

module.exports = {
  async docs() {
    // generate all docs (runs all docs:* commands in parallel)
    await Promise.all([this.docsHelpers(), this.docsPlugins(), this.docsExternalHelpers()])
  },

  async def() {
    await Promise.all([this.buildLibWithDocs(true), this.docsPlugins(), this.docsExternalHelpers()])
    await this.defTypings()
  },

  async defTypings() {
    console.log('Generate TypeScript definition')
    // Generate definitions for promised-based helper methods
    await npx('jsdoc -c typings/jsdocPromiseBased.conf.json')
    fs.renameSync('typings/types.d.ts', 'typings/promiseBasedTypes.d.ts')
    // Generate all other regular definitions
    await npx('jsdoc -c typings/jsdoc.conf.json')
  },

  async docsPlugins() {
    // generate documentation for plugins: each plugin gets a dedicated page

    if (!fs.existsSync('docs/plugins')) fs.mkdirSync('docs/plugins')

    const files = fs.readdirSync('lib/plugin').filter(f => path.extname(f) === '.js')

    const sharedPartials = fs.readdirSync('docs/shared').filter(f => path.extname(f) === '.mustache')
    const sharedPlaceholders = sharedPartials.map(file => `{{ ${path.basename(file, '.mustache')} }}`)
    const sharedTemplates = sharedPartials.map(file => fs.readFileSync(`docs/shared/${file}`).toString()).map(template => `\n\n\n${template}`)

    const index = []

    for (const file of files) {
      const name = path.basename(file, '.js')
      console.log(`Writing documentation for ${name} plugin`)

      await npx(`documentation build lib/plugin/${file} -o ${pluginMarkDownFile(name)} ${documentjsCliArgs}`)

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

      await writeToFile(pluginMarkDownFile(name), cfg => {
        cfg.append(`---
permalink: /plugins/${name}
editLink: false
sidebar: auto
title: ${name}
---

`)
        cfg.textFromFile(pluginMarkDownFile(name))
      })
    }

    // overview page links to every dedicated plugin page (keeps /plugins permalink)
    await writeToFile('docs/plugins.md', cfg => {
      cfg.line('---')
      cfg.line('permalink: /plugins')
      cfg.line('editLink: false')
      cfg.line('sidebar: auto')
      cfg.line('title: Plugins')
      cfg.line('---')
      cfg.line('')
      cfg.line('# Plugins')
      cfg.line('')
      cfg.line('CodeceptJS bundles the following plugins. Each plugin has its own page with full configuration reference.')
      cfg.line('')
      for (const { name, summary } of index) {
        cfg.line(`## [${name}](/plugins/${name})`)
        cfg.line('')
        if (summary) cfg.line(summary)
        cfg.line('')
      }
    })
  },


  async docsExternalHelpers() {
    // generate documentation for helpers outside of main repo
    console.log('Building @codecepjs/detox helper docs')
    let helper = 'Detox'
    replaceInFile(`node_modules/@codeceptjs/detox-helper/${helper}.js`, cfg => {
      cfg.replace(/CodeceptJS.LocatorOrString/g, 'string | object')
      cfg.replace(/LocatorOrString/g, 'string | object')
    })
    await npx(`documentation build node_modules/@codeceptjs/detox-helper/${helper}.js -o ${helperMarkDownFile(helper)} ${documentjsCliArgs}`)

    await writeToFile(helperMarkDownFile(helper), cfg => {
      cfg.line(`---\npermalink: /helpers/${helper}\nsidebar: auto\ntitle: ${helper}\n---\n\n# ${helper}\n\n`)
      cfg.textFromFile(helperMarkDownFile(helper))
    })

    replaceInFile(`node_modules/@codeceptjs/detox-helper/${helper}.js`, cfg => {
      cfg.replace(/string \| object/g, 'CodeceptJS.LocatorOrString')
      cfg.replace(/string \| object/g, 'LocatorOrString')
    })

    console.log('Building @codeceptjs/mock-request')
    helper = 'MockRequest'
    replaceInFile('node_modules/@codeceptjs/mock-request/index.js', cfg => {
      cfg.replace(/CodeceptJS.LocatorOrString/g, 'string | object')
      cfg.replace(/LocatorOrString/g, 'string | object')
    })
    await npx(`documentation build node_modules/@codeceptjs/mock-request/index.js -o ${helperMarkDownFile(helper)} ${documentjsCliArgs}`)

    await writeToFile(helperMarkDownFile(helper), cfg => {
      cfg.line(`---\npermalink: /helpers/${helper}\nsidebar: auto\ntitle: ${helper}\n---\n\n# ${helper}\n\n`)
      cfg.textFromFile(helperMarkDownFile(helper))
    })

    replaceInFile('node_modules/@codeceptjs/mock-request/index.js', cfg => {
      cfg.replace(/string \| object/g, 'CodeceptJS.LocatorOrString')
      cfg.replace(/string \| object/g, 'LocatorOrString')
    })
  },

  async docsExternalPlugins() {
    // generate documentation for helpers outside of main repo
    console.log('Building Vue plugin docs')
    const resp = await fetch('https://raw.githubusercontent.com/codecept-js/vue-cli-plugin-codeceptjs-puppeteer/master/README.md')
    const body = await resp.text()

    writeToFile('docs/vue.md', cfg => {
      cfg.line('---\npermalink: /vue\nlayout: Section\nsidebar: false\ntitle: Testing Vue Apps\n---\n\n')
      cfg.line(body)
    })

    this.docsCi()
  },

  async buildLibWithDocs(forTypings = false) {
    // generate documentation for helpers
    const files = fs.readdirSync('lib/helper').filter(f => path.extname(f) === '.js')

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
      console.log(`Building helpers with docs for ${name}`)
      copy(`lib/helper/${file}`, `docs/build/${file}`)
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
        // Convert ESM imports to require() for JSDoc compatibility
        cfg.replace(/^import\s+([^'"`\s{]+)\s+from\s+['"`]([^'"`]+)['"`]/gm, "const $1 = require('$2')")
        cfg.replace(/^import\s*\{\s*([^}]+)\s*\}\s*from\s+['"`]([^'"`]+)['"`]/gm, (match, imports, path) => {
          // Handle destructuring imports with aliases - convert to simple require and assign
          if (imports.includes(' as ')) {
            const parts = imports.split(',').map(i => i.trim())
            const assignments = parts.map(part => {
              if (part.includes(' as ')) {
                const [original, alias] = part.split(' as ').map(s => s.trim())
                return `const ${alias} = require('${path}').${original}`
              } else {
                return `const ${part} = require('${path}').${part}`
              }
            })
            return assignments.join(';\n')
          }
          return `const { ${imports} } = require('${path}')`
        })
        cfg.replace(/^import\s+\*\s+as\s+([^'"`]+)\s+from\s+['"`]([^'"`]+)['"`]/gm, "const $1 = require('$2')")

        // Convert ESM exports to module.exports for JSDoc compatibility
        cfg.replace(/^export\s*\{\s*([^}]+)\s+as\s+default\s*\}/gm, 'module.exports = $1')
        cfg.replace(/^export\s+default\s+(.+)/gm, 'module.exports = $1')
        cfg.replace(/^export\s*\{\s*([^}]+)\s*\}/gm, 'module.exports = { $1 }')
        cfg.replace(/^export\s+(class|function|const|let|var)\s+([^\s=]+)/gm, '$1 $2')
      })
    }
  },

  async docsHelpers() {
    // generate documentation for helpers
    const files = fs.readdirSync('lib/helper').filter(f => path.extname(f) === '.js')

    const ignoreList = ['Polly', 'MockRequest'] // WebDriverIO won't be documented and should be removed

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
      console.log(`Writing documentation for ${name}`)
      copy(`lib/helper/${file}`, `docs/build/${file}`)
      replaceInFile(`docs/build/${file}`, cfg => {
        for (const i in placeholders) {
          cfg.replace(placeholders[i], templates[i])
        }
        cfg.replace(/CodeceptJS.LocatorOrString\?/g, '(string | object)?')
        cfg.replace(/LocatorOrString\?/g, '(string | object)?')
        cfg.replace(/CodeceptJS.LocatorOrString/g, 'string | object')
        cfg.replace(/LocatorOrString/g, 'string | object')
        cfg.replace(/CodeceptJS.StringOrSecret/g, 'string | object')

        // Convert ESM imports to require() for JSDoc compatibility
        cfg.replace(/^import\s+([^'"`\s{]+)\s+from\s+['"`]([^'"`]+)['"`]/gm, "const $1 = require('$2')")
        cfg.replace(/^import\s*\{\s*([^}]+)\s*\}\s*from\s+['"`]([^'"`]+)['"`]/gm, (match, imports, path) => {
          // Handle destructuring imports with aliases - convert to simple require and assign
          if (imports.includes(' as ')) {
            const parts = imports.split(',').map(i => i.trim())
            const assignments = parts.map(part => {
              if (part.includes(' as ')) {
                const [original, alias] = part.split(' as ').map(s => s.trim())
                return `const ${alias} = require('${path}').${original}`
              } else {
                return `const ${part} = require('${path}').${part}`
              }
            })
            return assignments.join(';\n')
          }
          return `const { ${imports} } = require('${path}')`
        })
        cfg.replace(/^import\s+\*\s+as\s+([^'"`]+)\s+from\s+['"`]([^'"`]+)['"`]/gm, "const $1 = require('$2')")

        // Convert ESM exports to module.exports for JSDoc compatibility
        cfg.replace(/^export\s*\{\s*([^}]+)\s+as\s+default\s*\}/gm, 'module.exports = $1')
        cfg.replace(/^export\s+default\s+(.+)/gm, 'module.exports = $1')
        cfg.replace(/^export\s*\{\s*([^}]+)\s*\}/gm, 'module.exports = { $1 }')
        cfg.replace(/^export\s+(class|function|const|let|var)\s+([^\s=]+)/gm, '$1 $2')
      })

      await npx(`documentation build docs/build/${file} -o docs/helpers/${name}.md ${documentjsCliArgs}`)
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
        await this.docsAppium()
      }

      await writeToFile(helperMarkDownFile(name), cfg => {
        cfg.append(`---
permalink: /helpers/${name}
editLink: false
sidebar: auto
title: ${name}
---

`)
        cfg.textFromFile(helperMarkDownFile(name))
      })
    }
  },

  async wiki() {
    // publish wiki pages to website
    if (!fs.existsSync('docs/wiki/Home.md')) {
      await git(fn => {
        fn.clone('git@github.com:codeceptjs/CodeceptJS.wiki.git', 'docs/wiki')
      })
    }
    await chdir('docs/wiki', () => git(cfg => cfg.pull('origin master')))

    await writeToFile('docs/community-helpers.md', cfg => {
      cfg.line('---')
      cfg.line('permalink: /community-helpers')
      cfg.line('title: Community Helpers')
      cfg.line('editLink: false')
      cfg.line('---')
      cfg.line('')
      cfg.line('# Community Helpers')
      cfg.line('> Share your helpers at our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Community-Helpers)')
      cfg.line('')
      cfg.textFromFile('docs/wiki/Community-Helpers-&-Plugins.md')
    })

    writeToFile('docs/examples.md', cfg => {
      cfg.line('---')
      cfg.line('permalink: /examples')
      cfg.line('layout: Section')
      cfg.line('sidebar: false')
      cfg.line('title: Examples')
      cfg.line('editLink: false')
      cfg.line('---')
      cfg.line('')
      cfg.line('# Examples')
      cfg.line('> Add your own examples to our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Examples)')
      cfg.textFromFile('docs/wiki/Examples.md')
    })

    writeToFile('docs/books.md', cfg => {
      cfg.line('---')
      cfg.line('permalink: /books')
      cfg.line('layout: Section')
      cfg.line('sidebar: false')
      cfg.line('title: Books & Posts')
      cfg.line('editLink: false')
      cfg.line('---')
      cfg.line('')
      cfg.line('# Books & Posts')
      cfg.line('> Add your own books or posts to our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Books-&-Posts)')
      cfg.textFromFile('docs/wiki/Books-&-Posts.md')
    })

    writeToFile('docs/videos.md', cfg => {
      cfg.line('---')
      cfg.line('permalink: /videos')
      cfg.line('layout: Section')
      cfg.line('sidebar: false')
      cfg.line('title: Videos')
      cfg.line('editLink: false')
      cfg.line('---')
      cfg.line('')
      cfg.line('> Add your own videos to our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Videos)')
      cfg.textFromFile('docs/wiki/Videos.md')
    })
  },

  async docsAppium() {
    // generates docs for appium
    const onlyWeb = [/Title/, /Popup/, /Cookie/, /Url/, /^press/, /^refreshPage/, /^resizeWindow/, /Script$/, /cursor/, /Css/, /Tab$/, /^wait/]
    const webdriverDoc = await documentation.build(['docs/build/WebDriver.js'], {
      shallow: true,
      order: 'asc',
    })
    const doc = await documentation.build(['docs/build/Appium.js'], {
      shallow: true,
      order: 'asc',
    })

    // copy all public methods from webdriver
    for (const method of webdriverDoc[0].members.instance) {
      if (onlyWeb.filter(f => method.name.match(f)).length) continue
      if (doc[0].members.instance.filter(m => m.name === method.name).length) continue
      doc[0].members.instance.push(method)
    }
    const output = await documentation.formats.md(doc)
    // output is a string of Markdown data
    fs.writeFileSync('docs/helpers/Appium.md', output)
  },

  async publishSite() {
    // updates codecept.io website
    await processChangelog()
    await this.wiki()

    const dir = 'website'
    if (fs.existsSync(dir)) {
      await exec(`rm -rf ${dir}`)
    }

    await git(fn => fn.clone('git@github.com:codeceptjs/website.git', dir))
    await copy('docs', 'website/docs')

    await chdir(dir, async () => {
      stopOnFail(false)
      await git(fn => {
        fn.add('-A')
        fn.commit('-m "synchronized with docs"')
        fn.pull()
        fn.push()
      })
      stopOnFail(true)

      await exec('./runok.js publish')
    })
  },

  async server() {
    // run test server. Warning! PHP required!
    await Promise.all([exec('php -S 127.0.0.1:8000 -t test/data/app'), npmRun('test-server')])
  },

  async release(releaseType = null) {
    const packageInfo = JSON.parse(fs.readFileSync('package.json'))
    // Releases CodeceptJS. You can pass in argument "patch", "minor", "major" to update package.json
    if (releaseType) {
      packageInfo.version = semver.inc(packageInfo.version, releaseType)
      fs.writeFileSync('package.json', JSON.stringify(packageInfo))
      await git(cmd => {
        cmd.add('package.json')
        cmd.commit('-m "version bump"')
      })
    }
    // publish a new release on npm. Update version in package.json!
    const version = packageInfo.version
    await this.docs()
    await this.def()
    await this.publishSite()
    await git(cmd => {
      cmd.pull()
      cmd.tag(version)
      cmd.push('origin 3.x --tags')
    })
    await exec('rm -rf docs/wiki/.git')
    await exec('npm publish')
    console.log('-- RELEASED --')
  },

  async versioning() {
    const semver = require('semver')

    if (fs.existsSync('./package.json')) {
      const packageFile = require('./package.json')
      const currentVersion = packageFile.version
      let type = process.argv[3]
      if (!['major', 'minor', 'patch'].includes(type)) {
        type = 'patch'
      }

      const newVersion = semver.inc(packageFile.version, type)
      packageFile.version = newVersion
      fs.writeFileSync('./package.json', JSON.stringify(packageFile, null, 2).replace(/(^[ \t]*\n)/gm, ''))
      console.log('Version updated', currentVersion, '=>', newVersion)

      const file = 'CHANGELOG.md'
      const changelog = fs.readFileSync(file).toString()

      const _changelog = `## ${newVersion}\n
❤️ Thanks all to those who contributed to make this release! ❤️

🛩️ *Features*

🐛 *Bug Fixes*

📖 *Documentation*

${changelog}`

      fs.writeFileSync(`./${file}`, _changelog)

      console.log('Creating and switching to release branch...')
      await exec(`git checkout -b release-${newVersion}`)
    }
  },

  async getCommitLog() {
    console.log('Gathering commits...')
    const logs = await exec('git log --grep "chore(deps" --invert-grep --pretty=\'format:* %s - by @%aN\' $(git describe --abbrev=0 --tags)..HEAD | grep "DOC: " -v')
    console.log(logs.data.stdout)
  },

  async contributorFaces() {
    // update contributors list in readme
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

      // Filter out bot accounts
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

      // Chunk contributors into rows of 4
      const rows = []
      const chunkSize = 4
      for (let i = 0; i < contributors.length; i += chunkSize) {
        rows.push(`<tr>${contributors.slice(i, i + chunkSize).join('')}</tr>`)
      }

      // Combine rows into a table
      const contributorsTable = `
<table>
  ${rows.join('\n')}
</table>
    `

      const readmePath = path.join(__dirname, 'README.md')
      let content = fs.readFileSync(readmePath, 'utf-8')

      // Replace or add the contributors section in the README
      const contributorsSectionRegex = /(## Contributors\s*\n)([\s\S]*?)(\n##|$)/
      const match = content.match(contributorsSectionRegex)

      if (match) {
        const updatedContent = content.replace(contributorsSectionRegex, `${match[1]}\n${contributorsTable}\n${match[3]}`)
        fs.writeFileSync(readmePath, updatedContent, 'utf-8')
      } else {
        // If no contributors section exists, add one at the end
        content += `\n${contributorsTable}`
        fs.writeFileSync(readmePath, content, 'utf-8')
      }

      console.log('Contributors section updated successfully!')
    } catch (error) {
      console.error('Error fetching contributors:', error.message)
    }
  },

  getCurrentBetaVersion() {
    try {
      const output = execSync('npm view codeceptjs versions --json').toString()
      const versions = JSON.parse(output)
      const betaVersions = versions.filter(version => version.includes('beta'))
      const latestBeta = betaVersions.length ? betaVersions[betaVersions.length - 1] : null
      console.log(`Current beta version: ${latestBeta}`)
      return latestBeta
    } catch (error) {
      console.error('Error fetching package versions:', error)
      process.exit(1)
    }
  },

  publishNextBetaVersion() {
    const currentBetaVersion = this.getCurrentBetaVersion()
    if (!currentBetaVersion) {
      console.error('No beta version found.')
      process.exit(1)
    }

    const nextBetaVersion = semver.inc(currentBetaVersion, 'prerelease', 'beta')
    console.log(`Publishing version: ${nextBetaVersion}`)

    try {
      // Save original version
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      const originalVersion = packageJson.version
      execSync(`npm version ${nextBetaVersion} --no-git-tag-version`)
      execSync('npm publish --tag beta')
      console.log(`Successfully published ${nextBetaVersion}`)

      // Revert to original version
      execSync(`npm version ${originalVersion} --no-git-tag-version`)
      console.log(`Reverted back to original version: ${originalVersion}`)
    } catch (error) {
      console.error('Error publishing package:', error)
      process.exit(1)
    }
  },

  async runnerCreateTests(featureName) {
    // create runner tests for feature
    const fs = require('fs').promises
    const path = require('path')

    // Create directories
    const configDir = path.join('test/data/sandbox/configs', featureName)
    await fs.mkdir(configDir, { recursive: true })

    // Create codecept config file
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
    await fs.writeFile(path.join(configDir, `codecept.conf.js`), configContent)

    // Create feature test file
    const testContent = `Feature('${featureName}');

Scenario('test ${featureName}', ({ I }) => {
  // Add test steps here
});
`
    await fs.writeFile(path.join(configDir, `${featureName}_test.js`), testContent)

    // Create runner test file
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
    await fs.writeFile(path.join('test/runner', `${featureName}_test.js`), runnerTestContent)

    console.log(`Created test files for feature: ${featureName}`)

    console.log('Run codecept tests with:')
    console.log(`./bin/codecept.js run --config ${configDir}/codecept.conf.js`)

    console.log('')
    console.log('Run tests with:')
    console.log(`npx mocha test/runner --grep ${featureName}`)
  },
}

async function processChangelog() {
  const file = 'CHANGELOG.md'
  let changelog = fs.readFileSync(file).toString()

  // user
  changelog = changelog.replace(/\s@([\w-]+)/gm, ' **[$1](https://github.com/$1)**')

  // issue
  changelog = changelog.replace(/#(\d+)/gm, '[#$1](https://github.com/codeceptjs/CodeceptJS/issues/$1)')

  // helper
  changelog = changelog.replace(/\s\[(\w+)\]\s/gm, ' **[$1]** ')

  writeToFile('docs/changelog.md', cfg => {
    cfg.line('---')
    cfg.line('permalink: /changelog')
    cfg.line('title: Releases')
    cfg.line('sidebar: false')
    cfg.line('layout: Section')
    cfg.line('---')
    cfg.line('')
    cfg.line('# Releases')
    cfg.line('')
    cfg.line(changelog)
  })
}

if (require.main === module) runok(module.exports)
